/*
*
*
* load remote yaml:
*   curl -XPOST "localhost:60011/bucket" --data-binary @go/src/beaplane/bucket-obus-node-01.yaml -H "Content-type: text/x-yaml" 
*
* load local file:
*   curl -XPOST localhost:60011/bucket?file=bucket-obus-node-01.yaml
*
* get all configured nodes:
*  curl -XGET "localhost:60011/nodes"
*
* get snapshots from nodes:
*   curl -XGET "localhost:60011/snapshot?obus-node-01&obus-second-id"
*
*  shutdown
*   curl -XPUT "localhost:60011/shutdown"
*
*/

package main

import (
	"fmt"
	"flag"
	"context"
	"sync"
	"os"
	"io"
	"net/http"
	"time"
_	"reflect"

	// BEAPLANE
	"../../pkg/logmont"
//	beaplane_resource "../../pkg/resource"
	beaplane_server   "../../pkg/manager"
	"../../pkg/bucket"

	// go-control-plane changed
	_ "github.com/envoyproxy/go-control-plane/pkg/cache"
	"../../pkg/cache"
	//	xds "github.com/envoyproxy/go-control-plane/pkg/server"
	xds "../../pkg/xds"


	// go-conrol-plane unchanged
	"github.com/envoyproxy/go-control-plane/envoy/api/v2"
	
	os_signal "os/signal"
        "gopkg.in/yaml.v2"
	"io/ioutil"

	"github.com/sirupsen/logrus"
)

var (
	debug bool
	trace bool

	mode          string

	upstreamPort uint
	basePort     uint
	clusters      int
	httpListeners int
	tcpListeners  int

)

var (
	log *logmont.Logger
	// beaplane
	filename string
)

//
// CALLBACKS
//
type callbacks struct {
	signal   chan struct{}
	fetches  int
	requests int
	mu       sync.Mutex
}

func (cb *callbacks) RepRuort() {
	cb.mu.Lock()
	defer cb.mu.Unlock()
	log.Debug("beaplane.go: callbacks.Report(): " +
		fmt.Sprintf("fetches = %d, requests = %d",cb.fetches, cb.requests))
}
func (cb *callbacks) OnStreamOpen(id int64, typ string) {
	log.Debug("beaplane.go: callbacks.OnStreamOpen(): " +
		fmt.Sprintf("stream id=%d open for %s",id,typ))
}
func (cb *callbacks) OnStreamClosed(id int64) {
	log.Debugf("stream id=%d closed", id)
	log.Debug("beaplane.go: callbacks.OnStreamClosed(): " +
		fmt.Sprintf("stream id=%d closed ",id))
}
func (cb *callbacks) OnStreamRequest(id int64, request *v2.DiscoveryRequest) {
	log.Debug("beaplane.go: callbacks.OnStreamRequest(): " +
		fmt.Sprintf("stream id=%d request.Node.Id = %s", id, request.Node.Id))
	log.Debug("beaplane.go: callbacks.OnStreamRequest(): " +
		fmt.Sprintf("stream id=%d request =>\n{%+v}", id, request))
	cb.mu.Lock()
	defer cb.mu.Unlock()
	cb.requests++
	/*
	if cb.signal != nil {
		close(cb.signal)
		cb.signal = nil
	}
        */
	cb.signal <- struct{}{}
}

func (cb *callbacks) OnStreamResponse(id int64, request *v2.DiscoveryRequest, response *v2.DiscoveryResponse) {
	if request == nil || request.Node == nil {
		log.Debug("beaplane.go: callbacks.OnStreamResponse(): " +
			fmt.Sprintf("stream id=%d request.Node.Id = %s", id, "TODO: nil"))
	} else {
		log.Debug("beaplane.go: callbacks.OnStreamResponse(): " +
			fmt.Sprintf("stream id=%d request.Node.Id = %s", id, request.Node.Id))
	}
	log.Debug("beaplane.go: in.callbacks.OnStreamResponse(): " +
		fmt.Sprintf("stream id=%d request =>\n{%+v}", id, request))
	log.Debug("beaplane.go: callbacks.OnStreamResponse(): " +
		fmt.Sprintf("stream id=%d response =>\n{%+v}", id, response))
}

func (cb *callbacks) OnFetchRequest(request *v2.DiscoveryRequest) {
	log.Debug("beaplane.go: callbacks.OnFetchRequest(): " +
		fmt.Sprintf("fetch request =>\n{%+v}", request))
	cb.mu.Lock()
	defer cb.mu.Unlock()
	cb.fetches++
	if cb.signal != nil {
		close(cb.signal)
		cb.signal = nil
	}
}

func (cb *callbacks) OnFetchResponse(request *v2.DiscoveryRequest, response *v2.DiscoveryResponse) {
	log.Debug("beaplane.go: callbacks.OnFetchResponse(): " +
		fmt.Sprintf("fetch =>\nrequest = {%+v}", request) +
		fmt.Sprintf("\nresponse = {%+v}", response))
}

//
// HTTP API handlers
//
type handlers struct {
	cb *callbacks
	config cache.SnapshotCache
	srv xds.Server
	apiServer *http.Server
	ctx context.Context
	cancel context.CancelFunc
}

func (h *handlers) runApiHTTP(cb *callbacks, srv xds.Server, config cache.SnapshotCache) {
	h.cb = cb
	h.config = config
	h.srv = srv
	mux := http.NewServeMux()
	mux.HandleFunc("/shutdown", h.handleShutdown)
	mux.HandleFunc("/bucket", h.handleBucket)
	mux.HandleFunc("/nodes", h.handleNodes)
	mux.HandleFunc("/snapshot", h.handleSnapshot)
	
	log.Debug("beaplane.go: handlers.runApiHTTP(): start HTTP API on localhost:60011")
	h.apiServer = &http.Server{Addr: "localhost:60011", Handler: mux}
	h.apiServer.ListenAndServe()
}

func (h *handlers) handleShutdown(writer http.ResponseWriter, request *http.Request) {
	log.Debug("beaplane.go: handlers.handleShutdown(): start")
	if request.Method == "PUT" {
		io.WriteString(writer, "beaplane: shutting down the server\n")
		writer.(http.Flusher).Flush()
		h.cancel()
	} else {
		http.Error(writer, "PUT only", http.StatusMethodNotAllowed)
	}
	log.Debug("beaplane.go: handlers.handleShutdown(): finish")
}


func (h *handlers) handleNodes(writer http.ResponseWriter, request *http.Request) {

	if request.Method != "GET" {
		http.Error(writer, "beaplane: GET /nodes only", http.StatusMethodNotAllowed)
		return
	}

	nodes := h.config.GetNodes()

	io.WriteString(writer, fmt.Sprintf("%+v",nodes))
}

func (h *handlers) handleSnapshot(writer http.ResponseWriter, request *http.Request) {
	if request.Method != "GET" {
		http.Error(writer, "beaplane: GET /nodes only", http.StatusMethodNotAllowed)
		return
	}

	retyml := ""

	for node, _ := range request.URL.Query() {
		if snapshot, ok := h.config.GetSnapshot(node); ok {
			yml, err := yaml.Marshal(snapshot)
			if err != nil {
				http.Error(writer, fmt.Sprintf("could not marshall node %s to yaml, erro = %s", node, err), http.StatusBadRequest)
			}
			retyml += fmt.Sprintf("---\nnodes:\n  - %s\n%s", node, string(yml))
		} else {
			http.Error(writer, fmt.Sprintf("node %s is not in cache", node), http.StatusBadRequest)
		}
	}

	io.WriteString(writer, retyml)
}

func (h *handlers) handleBucket(writer http.ResponseWriter, request *http.Request) {
	log.Debugf("beaplane.go: handlers.handleBucket(): start")

	if request.Method != "POST" {
		http.Error(writer, "call POST /bucket instead", http.StatusMethodNotAllowed)
		return
	}

	bkt := bucket.New()
	
	// first check the body
	yml, err :=  ioutil.ReadAll(request.Body)

	if err != nil {
		log.Errorf("beaplane.go: handlers.handleBucket(): malformed request body, err = " + fmt.Sprintf("%s",err))

		io.WriteString(writer, "beaplane: ERROR: malformed request body, err = " + fmt.Sprintf("%s\n", err))
		writer.(http.Flusher).Flush()
	}

	if len(yml) != 0 {
		log.Debugf("beaplane.go: handlers.handleBucket(): processing body...")

		err = bkt.FromYAML(yml)

		if err != nil {
			log.Errorf("beaplane.go: handlers.handleBucket(): malformed yaml in request body")
			io.WriteString(writer, "ERROR: beaplane: malformed yaml in request body, err = " + fmt.Sprintf("%s\n", err))
			writer.(http.Flusher).Flush()
			return
		}

	} else if len(request.URL.Query()["file"]) != 0 {
		fileName := request.URL.Query()["file"][0]

		log.Debugf("beaplane.go: handlers.handleBucket(): loading fil %se...", fileName)

		err = bkt.FromFile(fileName)
		
		if err != nil {
			log.Errorf("beaplane.go: handlers.handleBucket(): cloud not load file, err = %s", err)
			io.WriteString(writer, fmt.Sprintf("ERROR: beaplane: couold not load bucket file %s, err = %s\n", fileName, err))
			writer.(http.Flusher).Flush()
			return
		}
		io.WriteString(writer, fmt.Sprintf("OK: beaplane: loaded local bucket from file %s\n", fileName))
		writer.(http.Flusher).Flush()
	} else {
		log.Debugf("beaplane.go: handlers.handleBucket(): something in request, returning")
		io.WriteString(writer, "ERROR: beaplane: unknown err = " + fmt.Sprintf("%+v\n", err))
		writer.(http.Flusher).Flush()
		return
	}

	log.Tracef("beaplane.go: handlers.handleBucket(): bkt  =>\n%+v", bkt)

	snapshot,_ := bkt.GetSnapshot()
	log.Debugf("beaplane.go: handlers.handleBucket(): bucket snapshot =>\n%+v", snapshot)

	for _,nodeID := range bkt.Nodes {
		log.Debugf("beaplane.go: handlers.handleBucket(): setting snapshot for nodeID = %s", nodeID)
		err = h.config.SetSnapshot(nodeID, snapshot)

		if err != nil {
			log.Error("beaplane.go: handlers.handleBucket(): could not set snapshot")
			io.WriteString(writer, "ERROR: beaplane: could not set snapshot, err = " + fmt.Sprintf("%s\n", err))
			writer.(http.Flusher).Flush()
			return
		}
	}
	
	io.WriteString(writer, "beaplane: OK: loaded bucket\n")
	writer.(http.Flusher).Flush()

	log.Debugf("beaplane.go: handlers.handleBucket(): finish")
	return
}

func init() {
	flag.BoolVar(&debug, "debug", false, "Use debug logging")
	flag.BoolVar(&trace, "trace", false, "Use trace") 
	flag.StringVar(&filename, "bucket", "bucket.yaml", "initial bucket to load")
}

func main() {
	flag.Parse()

	log = logmont.New()

	if trace {
		log.SetTrace(true)
		log.SetLevel(logrus.DebugLevel)
	} else if debug {
		log.SetLevel(logrus.DebugLevel)
	}

	log.Debug("beaplane.go: main(): start")
	
	// read initial bucket file
	bkt := bucket.New()
	err := bkt.FromFile(filename)

	// if we can't read initial file, that's ok, just warn,
	// we're initializing with empty config, we'll receive
	// all configuration through HTTP API
	if err != nil {
		log.Warnf("beaplane.go: main(): could not read initial bucket file %s, err = %s", filename, err)
	}

	log.Tracef("beaplane.go: main(): init bucket =>\n%+v\n", bkt)

	//
	// Set server objects
	//
	ctx, cancel := context.WithCancel(context.Background())
	signal := make(chan struct{})
	cb := &callbacks{signal: signal}
	config := cache.NewSnapshotCache(mode == "xds", beaplane_server.Hasher{}, log)
	srv := xds.NewServer(config, cb)

	log.Tracef("beaplane.go: main(): cb = %+v",cb)
	log.Tracef("beaplane.go: main(): config =>\n%+v\n",config)
	log.Tracef("beaplane.go: main(): srv =>\n%+v\n", srv)

	// CTRL-C
	go func(ctx context.Context, cancel context.CancelFunc) {
		log.Info("beaplane.go: main().func(): starting CTRL-C handler...")
		
		// cancel after we're finished
		// blocking on channel
		// and finished the function
		defer cancel()
		var os_signal_chan = make(chan os.Signal, 1)
		os_signal.Notify(os_signal_chan, os.Interrupt)
		<-os_signal_chan
		log.Info("beaplane.go: main().func(): got CTRL-C, shutting down...")
		log.Debug("beaplane.go: main().func(): cb =>\n " + fmt.Sprintf("{%+v}",cb))
		log.Debug("beaplane.go: main().func(): srv =>\n" + fmt.Sprintf("{%+v}",srv))
	}(ctx, cancel)
	
	go beaplane_server.RunManagementServer(ctx, srv, 55555)

	log.Info("beaplane.go: main(): waiting for the first request...")

	//
	// Populate config with node<-shapshot pairs
	//
	snapshot,_ := bkt.GetSnapshot()
	
	log.Tracef("beaplane.go: main(): init snapshot =>\n%+v\n", snapshot)

	for _,nodeID := range bkt.Nodes {
		log.Debugf("beaplane.go: main(): setting snapshot for node = %s", nodeID)

		err = config.SetSnapshot(nodeID, snapshot)

		if err != nil {
			log.Errorf("beaplane.go: main(): set error %s for snapshot =>\n%+v", err, snapshot)
		} 
	}
	
	// HTTP API
	handlers := &handlers{ctx: ctx, cancel: cancel}
	go handlers.runApiHTTP(cb, srv, config)
 	
	//
	// MAIN LOOP
	//
	log.Debug("beaplane.go: main(): wait for signal before loop...")
	done := false
	for !done {
		select {
		case <-time.After(1*time.Second):
			//log.Debug("beaplane.go: main(): waited")
		case <-signal:
			log.Debug("beaplane.go: main(): got signal")
			log.Debug("beaplane.go: main(): wait for signal...")
		case <-ctx.Done():
			log.Debug("beaplane.go: main(): ctx done")
			done = true
		}
	}
	log.Debug("beaplane.go: main(): finish")
}

