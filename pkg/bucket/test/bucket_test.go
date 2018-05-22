package bucket_test

import (
_	"reflect"
	"testing"
	"fmt"
	"regexp"
	"strings"

	"github.com/sirupsen/logrus"

	"github.com/envoyproxy/go-control-plane/envoy/api/v2"
_	"github.com/envoyproxy/go-control-plane/envoy/api/v2/core"

	"github.com/envoyproxy/go-control-plane/pkg/cache"

	
	"../../bucket"
	"../../logmont"

)

var (
	log *logmont.Logger
)

// Maximum logging for tests
func init() {
	fmt.Printf("INIT PACKAGE\n")
	log = logmont.New()
	log.Formatter = &logrus.TextFormatter{ForceColors: true}
	log.SetLevel(logrus.DebugLevel)
	log.SetTrace(true)
}

// TestLog checks logmont and passing logmont to bucket.
// Only visual testing and code example purpose only
// no assertions
func TestLog(t *testing.T) {
	t.Skip()

	fmt.Printf("TestLog(): start\n")

	logrus.Printf("bucket_test.go: TestLog(): printing from logrus before format")

	log := logrus.New()
	log.Formatter = &logrus.JSONFormatter{}
	log.Printf("bucket_test.go: TestLog(): printing JSONFormatter")

	log.Formatter = &logrus.TextFormatter{ForceColors: true}
	log.Infof("bucket_test.go: TestLog(): printing TextFormatter")
	// will not be displayed
	log.Debugf("bucket_test.go: TestLog(): no debug level")
	// will be displayed
	log.SetLevel(logrus.DebugLevel)
	log.Debugf("bucket_test.go: TestLog(): with debug level")
		
	lmont := logmont.New()
	lmont.Printf("bucket_test.go: TestLog(): lmont -> default printing")
	lmont.Formatter = &logrus.TextFormatter{ForceColors: true}
	lmont.Printf("bucket_test.go: TestLog(): lmont -> force colors")
	lmont.Printf("bucket_test.go: TestLog(): lmont -> PRINT s=%s", "print_string")
	lmont.Infof("bucket_test.go: TestLog(): lmont -> INFO s=%s", "info_string")
	lmont.Warnf("bucket_test.go: TestLog(): lmont -> WARN s=%s", "warn_string")
	lmont.Errorf("bucket_test.go: TestLog(): lmont -> ERROR s=%s", "error_string")

	lmont.SetLevel(logrus.DebugLevel)
	lmont.Debugf("bucket_test.go: TestLog(): lmont -> DEBUG s=%s", "debug_string")

	lmont.SetTrace(true)
	lmont.Tracef("bucket_test.go: TestLog(): lmont -> TRACE a1=%s, a2=%s\n", "args1", "args2")
	lmont.Tracef("bucket_test.go: TestLog(): lmont -> TRACE no argsstring")

	// should not display
	lmont.SetTrace(false)
	lmont.Tracef("bucket_test.go: TestLog(): lmont -> TRACE s=%s\n", "don't snow")

	bktLog := bucket.New()
	lmont.Infof("bucket_test.go: TestLog(): bktLog = %+v", bktLog)

	// Default settings for the default logmont
	bktLog.Logit()

	// Package level to keep it simple for now
	bucket.SetLogger(lmont)

	// Info and Debug, not Trace
	bktLog.Logit()

	// Info, Debug, Trace
	lmont.SetTrace(true)
	bktLog.Logit()
	
	fmt.Printf("TestLog(): finish\n")
}


// TestBucketNew test basic bucket construction
func TestBucketNew(t *testing.T) {
	t.Skip()

	bkt := bucket.New()
	if &bkt == nil {
		t.Errorf("bkt should not be nil")
	}

	nodes := bkt.Nodes

	if &bkt.Nodes == nil {
		t.Errorf("bkt.Nodes should not be nil")
	}

	log.Debugf("bucket_test.go: TestBucketNew(): nodes = %+v", nodes)

	if &bkt.Routes == nil {
		t.Errorf("bkt.Routes should not be nil")
	}
}

func TestBucketFromFileDirectRoute(t *testing.T) {
	t.Skip()
	bkt := bucket.New()

	bucket.SetLogger(log)
	filename := "./bucket-obus-node-01-eds-rds-60001-route-direct.yaml"
	err := bkt.FromFile(filename)

	if err != nil {
		t.Errorf("Could not bkt.FromFile(%s), err = %s", filename, err)
	}

	if val , exp := bkt.Nodes[0], "obus-node-01";
	val != exp {
		t.Errorf("bkt.Nodes[0] = %s, should be %s", val, exp)
	}

	if val , exp := len(bkt.Endpoints.Items), 1;
	val != exp {
		t.Errorf("len(bkt.Endpoints.Items) = %d, should be %d", val, exp)
	}


	if val , exp := bkt.Endpoints.Items[0].ClusterName, "obus-server-60001"
	val != exp {
		t.Errorf("bkt.Endpoints.Items[0].ClusterName = %s, should be %s", val, exp)
	}

	if val , exp := bkt.Endpoints.Items[0].Hosts[0].SocketAddress.PortValue, uint32(60001);
	val != exp {
		t.Errorf("bkt.Endpoints.Items[1].Hosts[0].SocketAddress.PortValue = %d, should be %d", val, exp)
	}

	if val , exp := bkt.Endpoints.Items[0].Hosts[1].SocketAddress.PortValue, uint32(60099);
	val != exp {
		t.Errorf("bkt.Endpoints.Items[1].Hosts[0].SocketAddress.PortValue = %d, should be %d", val, exp)
	}


	if val , exp := bkt.Routes.Items[0].RouteName, "obus_server_route";
	val != exp {
		t.Errorf("bkt.Routes.Items[0].RouteName = %s, should be %s", val, exp)
	}


	if val , exp := bkt.Routes.Items[0].VirtualHosts[0].Name, "virtual_host_name";
	val != exp {
		t.Errorf("bkt.Routes.Items[0].VirtualHosts[0].Name = %s, should be %s", val, exp)
	}

	if val , exp := bkt.Routes.Items[0].VirtualHosts[0].Domains[0], "*";
	val != exp {
		t.Errorf("bkt.Routes.Items[0].VirtualHosts[0].Domains[0] = %s, should be %s", val, exp)
	}

	if val , exp := bkt.Routes.Items[0].VirtualHosts[0].Routes[0].Match.Prefix, "/obus.";
	val != exp {
		t.Errorf("bkt.Routes.Items[0].VirtualHosts[0].Routes[0].Match.Prefix = %s, should be %s", val, exp)
	}

	if val , exp := bkt.Routes.Items[0].VirtualHosts[0].Routes[0].Route.ClusterName, "obus-server-60001";
	val != exp {
		t.Errorf("bkt.Routes.Items[0].VirtualHosts[0].Routes[0].Route.ClusterName = %s, should be %s", val, exp)
	}

	if val , exp := len(bkt.Routes.Items[0].VirtualHosts[0].Routes), 1
	val != exp {
		t.Errorf("len(bkt.Routes.Items[0].VirtualHosts[0].Route) = %d, should be %d", val, exp)
	}


	fin := make(chan bool)

	go func() {
		defer func() {
			if r := recover(); r == nil {
				t.Errorf("bkt.Routes.Items[0].VirtualHosts[0].Routes[0].Route.WeightedClusters.Clusters should be empty and cause panic")
				
			}
			fin <- true
		}()
		_ = bkt.Routes.Items[0].VirtualHosts[0].Routes[0].Route.WeightedClusters.Clusters[0]
	}()

	<- fin

	go func() {
		defer func() {
			if r := recover(); r == nil {
				t.Errorf("bkt.Routes.Items[0].VirtualHosts[0].Routes[0].Route.WeightedClusters.Clusters[0].Weight should be out of range cause panic")
			}
			fin <- true
		}()
		_ = bkt.Routes.Items[0].VirtualHosts[0].Routes[0].Route.WeightedClusters.Clusters[0].Weight
	}()

	<- fin

	if val , exp := bkt.Routes.Items[0].VirtualHosts[0].Routes[0].Route.WeightedClusters.TotalWeight, uint32(0);
	val != exp {
		t.Errorf("bkt.Routes.Items[0].VirtualHosts[0].Routes[0].Route.WeightedClusters.TotalWeight = %d, should be %d", val, exp)
	}
}


func TestBucketFromFileWeightedRoute(t *testing.T) {
	t.Skip()
	
	bkt := bucket.New()

	bucket.SetLogger(log)
	filename := "./bucket-obus-node-01-eds-rds-60001-60002-route-weighted.yaml"
	err := bkt.FromFile(filename)

	if err != nil {
		t.Errorf("Could not bkt.FromFile(%s), err = %s", filename, err)
	}

	if val , exp := bkt.Nodes[0], "obus-node-01";
	val != exp {
		t.Errorf("bkt.Nodes[0] = %s, should be %s", val, exp)
	}

	if val , exp := len(bkt.Endpoints.Items), 2;
	val != exp {
		t.Errorf("len(bkt.Endpoints.Items) = %d, should be %d", val, exp)
	}


	if val , exp := bkt.Endpoints.Items[0].ClusterName, "obus-server-60001"
	val != exp {
		t.Errorf("bkt.Endpoints.Items[0].ClusterName = %s, should be %s", val, exp)
	}

	if val , exp := bkt.Endpoints.Items[1].Hosts[0].SocketAddress.PortValue, uint32(60002);
	val != exp {
		t.Errorf("bkt.Endpoints.Items[1].Hosts[0].SocketAddress.PortValue = %d, should be %d", val, exp)
	}



	if val , exp := bkt.Routes.Items[0].RouteName, "obus_server_route";
	val != exp {
		t.Errorf("bkt.Routes.Items[0].RouteName = %s, should be %s", val, exp)
	}


	if val , exp := bkt.Routes.Items[0].VirtualHosts[0].Name, "virtual_host_name";
	val != exp {
		t.Errorf("bkt.Routes.Items[0].VirtualHosts[0].Name = %s, should be %s", val, exp)
	}

	if val , exp := bkt.Routes.Items[0].VirtualHosts[0].Domains[0], "*";
	val != exp {
		t.Errorf("bkt.Routes.Items[0].VirtualHosts[0].Domains[0] = %s, should be %s", val, exp)
	}

	if val , exp := bkt.Routes.Items[0].VirtualHosts[0].Routes[0].Match.Prefix, "/obus.";
	val != exp {
		t.Errorf("bkt.Routes.Items[0].VirtualHosts[0].Routes[0].Match.Prefix = %s, should be %s", val, exp)
	}

	if val , exp := bkt.Routes.Items[0].VirtualHosts[0].Routes[0].Route.ClusterName, "";
	val != exp {
		t.Errorf("bkt.Routes.Items[0].VirtualHosts[0].Routes[0].Route.ClusterName = %s, should be %s", val, exp)
	}

	// start on weighted clusters

	if val , exp := bkt.Routes.Items[0].VirtualHosts[0].Routes[0].Route.WeightedClusters.Clusters[0].Name, "obus-server-60001";
	val != exp {
		t.Errorf("bkt.Routes.Items[0].VirtualHosts[0].Routes[0].Route.WeightedClusters.Clusters[0].Name = %s, should be %s", val, exp)
	}

	if val , exp := bkt.Routes.Items[0].VirtualHosts[0].Routes[0].Route.WeightedClusters.Clusters[0].Weight, uint32(50);
	val != exp {
		t.Errorf("bkt.Routes.Items[0].VirtualHosts[0].Routes[0].Route.WeightedClusters.Clusters[0].Weight = %d, should be %d", val, exp)
	}


	if val , exp := bkt.Routes.Items[0].VirtualHosts[0].Routes[0].Route.WeightedClusters.TotalWeight, uint32(100);
	val != exp {
		t.Errorf("bkt.Routes.Items[0].VirtualHosts[0].Routes[0].Route.WeightedClusters.TotalWeight = %d, should be %d", val, exp)
	}
}


// TestBucketToYAML creates a weighted bucket and
// converts it to YAML
func TestBucketToYAML(t *testing.T) {
	t.Skip()
	
	bkt := bucket.New()

	bkt.Nodes = append(bkt.Nodes, "node-from-test")
	bkt.Endpoints.Version = "from-code"

	endpointItem := struct {
		ClusterName string `yaml:"cluster_name"`
		Hosts       []struct {
			SocketAddress struct {
				Address   string `yaml:"address"`
				PortValue uint32 `yaml:"port_value"`
			} `yaml:"socket_address"",flow"`
		} `yaml:"hosts"",flow"`
	}{
		ClusterName: "cluster-from-test",
	}
	
	bkt.Endpoints.Items = append(bkt.Endpoints.Items, endpointItem)
	
	// TODO: just a quick one for now
	// not checking the guts here
	yml, err := bkt.ToYAML()
	if err != nil {
		log.Tracef("bucket_test.go: TestBucketToYAML(): yml = %s", yml)
		t.Errorf("Could not bkt.ToYaml(), err = %s", err)
	}

	filename := "./bucket-obus-node-01-eds-rds-60001-route-direct.yaml"
	err = bkt.FromFile(filename)

	yml, err = bkt.ToYAML()
	if err != nil {
		log.Tracef("bucket_test.go: TestBucketToYAML(): yml = %s", yml)
		t.Errorf("Could not bkt.ToYAML(), err = %s", err)
	}

	log.Tracef("bucket_test.go: TestBucketToYAML(): yml = >\n%s", yml)


	// check yml for regex 60099
	// check ymkl for cluster_name: obus-server-60001 and make sure that it appears 2 times
	// one in endpoints, another time in routes

	rxp,_ := regexp.Compile("60099")

	if !rxp.MatchString(string(yml)) {
		t.Errorf("Could not find 60099 in generated YAML, while bkt.ToYAML()")
	}


	if val , exp := strings.Count(string(yml), "cluster_name: obus-server-60001"), 2;
	val != exp {
		t.Errorf("strings.Count(string(yml), \"cluster_name: obus-server-60001\") = %d, should be %d", val, exp)
	}
	
}


// TestBucketGetSnapshotDirectRoute checks snapshot where there is a
// direct route cluster_name -> "<ip>:<port>"
// TODO: more checks
func TestBucketGetSnapshotDirectRoute(t *testing.T) {
	// t.Skip()
	bucket.SetLogger(log)

	bkt := bucket.New()

	filename := "./bucket-obus-node-01-eds-rds-60001-route-direct.yaml"
	err := bkt.FromFile(filename)

	if err != nil {
		t.Errorf("Could not bkt.FromFile(%s), err = %s", filename, err)
	}

	if val , exp := bkt.Routes.Items[0].VirtualHosts[0].Routes[0].Route.ClusterName, "obus-server-60001";
	val != exp {
		t.Errorf("bkt.Routes.Items[0].VirtualHosts[0].Routes[0].Route.ClusterName = %s, should be %s", val, exp)
	}

	snapshot, err := bkt.GetSnapshot()
	
	if err != nil {
		t.Errorf("Could not bkt.GetSnapshot(), err = %+v", err)
	}

	res := snapshot.Endpoints.Items[0]

	clusterName := cache.GetResourceName(res)

	if clusterName != "obus-server-60001" {
		t.Errorf("clusterName := cache.GetResourceName(item) = %s, should be %s", clusterName, "obus-server-60001")
	}

	cla := res.(*v2.ClusterLoadAssignment)

	// TODO: check some more accessor methods 
	addr := cla.Endpoints[0].LbEndpoints[0].Endpoint.Address.Address
	if fmt.Sprintf("%+v",addr) != "&{SocketAddress:address:\"127.0.0.1\" port_value:60001 }" {
		t.Errorf("addr does not match")
	}
	
}


func TestBucketGetSnapshotWeightedRoute(t *testing.T) {
	// t.Skip()
	bkt := bucket.New()

	filename := "./bucket-obus-node-01-eds-rds-60001-60002-route-weighted.yaml"
	err := bkt.FromFile(filename)

	if err != nil {
		t.Errorf("Could not bkt.FromFile(%s), err = %s", filename, err)
	}

	if val , exp := bkt.Routes.Items[0].VirtualHosts[0].Routes[0].Route.ClusterName, "";
	val != exp {
		t.Errorf("bkt.Routes.Items[0].VirtualHosts[0].Routes[0].Route.ClusterName = %s, should be %s", val, exp)
	}

	log.SetLevel(logrus.DebugLevel)
	bucket.SetLogger(log)
	snapshot, err := bkt.GetSnapshot()
	
	if err != nil {
		t.Errorf("Could not bkt.GetSnapshot(), err = %+v", err)
	}

	//
	// Endpoint section
	//
	res := snapshot.Endpoints.Items[0]
	clusterName := cache.GetResourceName(res)
	if clusterName != "obus-server-60001" {
		t.Errorf("clusterName := cache.GetResourceName(item) = %s, should be %s", clusterName, "obus-server-60001")
	}
	cla := res.(*v2.ClusterLoadAssignment)
	// TODO: check some more accessor methods 
	addr := cla.Endpoints[0].LbEndpoints[0].Endpoint.Address.Address
	if fmt.Sprintf("%+v",addr) != "&{SocketAddress:address:\"127.0.0.1\" port_value:60001 }" {
		t.Errorf("addr does not match")
	}

	//
	// Route section
	//
	if val , exp := fmt.Sprintf("%+v", snapshot.Routes.Items[0].(*v2.RouteConfiguration).VirtualHosts[0].Routes[0].Action), "&{Route:weighted_clusters:<clusters:<name:\"obus-server-60001\" weight:<value:50 > > clusters:<name:\"obus-server-60002\" weight:<value:50 > > total_weight:<value:100 > > }";
	val != exp {
		t.Errorf("snapshot.Routes.Items[0].(*v2.RouteConfiguration).VirtualHosts[0].Routes[0].Action = %s, should be %s", val, exp)
	}

//	log.Debugf("bucket_test.go: TestBucketGetSnapshotWeightedRoute(): route_name = %+v", snapshot.Routes.Items[0].(*v2.RouteConfiguration).VirtualHosts[0].Routes[0].Action)

	
}


