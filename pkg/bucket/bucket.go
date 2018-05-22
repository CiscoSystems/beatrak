package bucket

import (
_	"fmt"
_	"github.com/sirupsen/logrus"
	"io/ioutil"
_	"reflect"
	
	// OSS
	"gopkg.in/yaml.v2"

	// GO-CONTROL-PLANE
	_ "github.com/envoyproxy/go-control-plane/pkg/cache"
	"../../pkg/cache"
	

	// BEAPLANE
	"../logmont"

	beaplane_resource "../resource"

)

var (
	log *logmont.Logger
)

// SetLogger sets external logger for the package
// Only package level settings for now for
// sinmplicity
func SetLogger(logger *logmont.Logger) {
	log = logger
}

// bucket structure
type bucket struct {
	Nodes    []string `yaml:"nodes"",flow"`
        Endpoints struct {
		Version  string `yaml:"version"`
		Items    []struct {
			ClusterName string `yaml:"cluster_name"`
			Hosts       []struct {
				SocketAddress struct {
					Address   string `yaml:"address"`
					PortValue uint32 `yaml:"port_value"`
				} `yaml:"socket_address"",flow"`
			} `yaml:"hosts"",flow"`
		}
        }
	Routes struct {
		Version  string `yaml:"version"`
		Items    []struct {
			RouteName      string `yaml:"route_name"`
			VirtualHosts  []struct {
				Name string `yaml:"name"`
				Domains []string `yaml:"domains"`
				Routes  []struct {
					Match struct {
						Prefix string `yaml:"prefix"`
					} `yaml:"match"",flow"`
					Route struct {
						ClusterName string `yaml:"cluster_name",omitempty`
						WeightedClusters struct {
							Clusters []struct {
								Name string `yaml:"name"`
								Weight uint32 `yaml:"weight"`
							} `yaml:"clusters"",flow"`
							TotalWeight uint32 `yaml:"total_weight"`
						} `yaml:"weighted_clusters"",flow"`
					} `yaml:"route"",flow"`
				} `yaml:"routes"",flow"`
			} `yaml:"virtual_hosts"",flow"`
		}
	}
}

// New initializes bucket.
// Sets logger to default logmont.New()
func New() bucket {
	log = logmont.New()
	return bucket{}
}

// Logit prints some test log messages
func (this *bucket) Logit() {
	log.Infof("bucket.go: Logit(): Infof, s = %s", "info string")
	log.Debugf("bucket.go: Logit(): Debugf, s = %s", "debug string")
	log.Tracef("bucket.go: Logit(): Tracef, s = %s", "trace string")
}


func (this *bucket) FromYAML(yml []byte) (error) {
	err := yaml.Unmarshal(yml, this)
	if err != nil {
		log.Errorf("bucket.go: fromYAML(): unmarshall err = %s", err)
		return err
        }

	return nil
}

func (this *bucket) ToYAML() ([]byte, error) {

	yml, err := yaml.Marshal(this)
	if err != nil {
		log.Errorf("bucket.go: toYAML(): marshall err = %s", err)
		return nil,err
        }

	return yml,nil
}


// FromFile is a comprehensive, multi-unit test that checks
// both bucket structure and FromYAML()
func (this *bucket) FromFile(fileName string) (error) {
	log.Debugf("bucket.go: FromFile(): reading filename = %s", fileName)

	yml, err := ioutil.ReadFile(fileName)

	if err != nil {
		log.Errorf("bucket.go: FromFile(): err = %s", err)
		return err
	}

	log.Tracef("bucket.go: FromFile(): yaml = %s", string(yml))

	err = this.FromYAML(yml)

	if err != nil {
		log.Errorf("bucket.go: FromFile(): err = %s", err)
		return err
        }

	log.Debugf("bucket.go: FromFile(): read success")
	return nil
}


func (this *bucket) GetSnapshot() (cache.Snapshot, error) {
	version := this.Endpoints.Version
	endpoints := make([]cache.Resource, 0)
	clusters := make([]cache.Resource, 0)
	routes := make([]cache.Resource, 0)
	listeners := make([]cache.Resource, 0)
	
	for _,cluster := range this.Endpoints.Items {
		// TRACE
		// fmt.Printf("cluster_name => %s\n", cluster.ClusterName)
		for _,host := range cluster.Hosts {
			// TRACE
			// fmt.Printf("host => %s:%d\n", host.SocketAddress.Address,host.SocketAddress.PortValue)
			endpoints = append(endpoints, beaplane_resource.MakeEndpoint(cluster.ClusterName, host.SocketAddress.PortValue))
		}
	}

	// TODO: simple cluster vs  weighted clusters
	// TODO: MakeDirectRoute, MakeWightedRoute <- make as what's already tested
	// TODO: proper depth with multiple virtual hosts, matches and routes here

	for _,route := range this.Routes.Items {
		// log.Debugf("bucket.go: GetSnapshot(): route = %+v", route)
		if(route.VirtualHosts[0].Routes[0].Route.ClusterName != "") {
			log.Debugf("bucket.go: GetSnapshot(): DIRECT ROUTE")
			routes = append(routes, beaplane_resource.MakeRouteDirect(route.RouteName, route.VirtualHosts[0].Routes[0].Route.ClusterName))
		} else if len(route.VirtualHosts[0].Routes[0].Route.WeightedClusters.Clusters) != 0 {
//			log.Debugf("bucket.go: GetSnapshot(): WEIGHTED ROUTE")
			clusters := route.VirtualHosts[0].Routes[0].Route.WeightedClusters.Clusters
//			log.Debugf("bucket.go: GetSnapshot(): clusters = %+v", clusters)
//			log.Debugf("bucket.go: GetSnapshot(): typeof(clusters) = %+v", reflect.TypeOf(clusters))
			weightedRoute := beaplane_resource.MakeRouteWeighted(route.RouteName, "/obus.", 100, clusters)
			routes = append(routes, weightedRoute)
		}
			

		/* TODO:
		for _,virtualHost := range route.VirtualHosts {
			fmt.Printf("virtual_host.name => %s", virtualHost.Name)
			routes = append(routes, beaplane_resource.MakeRoute(route.RouteName, route))
		}
               */
	}

	snapshot := cache.NewSnapshot(version, endpoints, clusters, routes, listeners)

	return snapshot, nil
}


