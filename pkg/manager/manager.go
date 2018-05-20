package manager

import (
	"fmt"
	"context"
	"net"


	log "github.com/sirupsen/logrus"
	"google.golang.org/grpc"
	"github.com/envoyproxy/go-control-plane/envoy/api/v2"
	"github.com/envoyproxy/go-control-plane/envoy/api/v2/core"
	xds "github.com/envoyproxy/go-control-plane/pkg/server"
)


// Hasher returns node ID as an ID
type Hasher struct {
}

// Hasher ID function
func (h Hasher) ID(node *core.Node) string {
	if node == nil {
		return "unknown"
	}
	return node.Id
}
	
func RunManagementServer(ctx context.Context, srv xds.Server, port uint) {
	log.Debug("manager.go: RunManagementServer(): start")
	grpcServer := grpc.NewServer()

	lis, err := net.Listen("tcp", fmt.Sprintf("localhost:%d", port))
	if err != nil {
		log.WithError(err).Fatal("manager.go: RunManagementServer(): failed to listen")
		return
	} 

	v2.RegisterEndpointDiscoveryServiceServer(grpcServer, srv)
	log.Info("manager.go: RunManagementServer(): registering EDS service server")
	v2.RegisterRouteDiscoveryServiceServer(grpcServer, srv)
	log.Info("manager.go: RunManagementServer(): registering RDS service server")
	go func() {
		if err = grpcServer.Serve(lis); err != nil {
			log.Error(err)
		}
	}()

	log.Info("manager.go: RunManagementServer(): manager listening on localhost:", port)
	
	<-ctx.Done()
	log.Debug("manager.go: RunManagementServer(): after <-ctx.Done()")

	grpcServer.GracefulStop()

	log.Debug("manager.go: RunManagementServer(): finish")
}
