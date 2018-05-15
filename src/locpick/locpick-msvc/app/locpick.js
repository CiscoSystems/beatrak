/*
 *
 * LOCPICK
 *
 */


"use strict";
  
const express = require("express")
const exec = require("child_process").exec
const execSync = require("child_process").execSync
const nocache = require("nocache")
const http = require("http")
const log = require("loglevel")
const getopt = require("node-getopt")
const grpc = require("grpc")
const fs = require("fs")
const utils = require("../common/utils.js") 
const m = utils.m;
 
//
// GLOBAL
//
var gl = {}
const PROTO_PATH = __dirname + "/../../../protos"
const KEY_PATH = __dirname + "/../../../keys"
const locpickProto = grpc.load(PROTO_PATH+"/locpick.proto").locpick
 
//
// CONFIG DATA
//
gl.config = {
    current : {
	type : "list",
	zone : "nozone"
    },
    list: [
	{"name" : "brussels", "lonlat" : "50.8386789,4.2931938", "zone" : "za"},
	{"name" : "paris", "lonlat" : "48.8588376,2.2768487", "zone" : "za"},
	{"name" : "amsterdam", "lonlat" : "52.3746949,4.828412", "zone" : "za"},
	{"name" : "noloc", "zone" : "za"},
	{"name" : "sj", "lonlat" : "37.2969949,-121.887452", "zone" : "zb"},
	{"name" : "sf", "lonlat" : "37.7576948,-122.4726192", "zone" : "zb"},
	{"name" : "la", "lonlat" : "34.0203996,-118.5518132", "zone" : "zb"},
	{"name" : "noloc", "zone" : "zb"},
	{"name" : "noloc", "zone" : "nozone"},
	{"name" : "devshell1", "lonlat" : "61.0,5.0",  "zone" : "zdevshell"},
	{"name" : "devshell_last", "lonlat" : "62.0,6.0",  "zone" : "zdevshell"},
    ]
}
  
// App
const app = express();
app.use(nocache());

// ------------------------------------------------
// GRPC methods
// ------------------------------------------------
//
// PING
//
const grpcPing = (call, callback) => {
    const response = {ServerID: `${gl.sid}`, Pong: `SIMPLE: callback(): ${gl.sid}=>${call.request.ClientID}`};
    //    log.debug(m("locpick.js: grpcPing(): response = ", response))
    log.debug(m("locpick.js: grpcPing(): response = " + JSON.stringify(response)))
    callback(null, response);
}

const initEnv = () => {
    if(typeof process.env.LOG_LEVEL === 'undefined' || process.env.LOG_LEVEL == "" ) {
	gl.logLevel = "error"
	console.log("log: locpick.js: initEnv(): LOG_LEVEL is undefined, gl.logLevel = ", gl.logLevel)
    } else {
	gl.logLevel = process.env.LOG_LEVEL
	console.log("log: locpick.js: initEnv(): gl.logLevel = ", gl.logLevel)
    }

    log.setLevel(gl.logLevel);
    
    if(typeof process.env.LOCPICK_HTTP_PORT === 'undefined' || process.env.LOCPICK_HTTP_PORT == "") {
	gl.locpickHttpPort = 8080
	console.log("log: locpick.js: initEnv(): LOCPICK_HTTP_PORT is undefined, gl.locpickHttpPort = " + gl.locpickHttpPort)
    } else {
	gl.locpickHttpPort = process.env.LOCPICK_HTTP_PORT
	console.log("log: locpick.js: initEnv(): gl.locpickHttpPort = " + gl.locpickHttpPort)
    }

    if(typeof process.env.LOCPICK_HTTP_HOST === 'undefined' || process.env.LOCPICK_HTTP_HOST == "") {
	gl.locpickHttpHost = "localhost"
	console.log("log: locpick.js: initEnv(): LOCPICK_HTTP_HOST is undefined, gl.locpickHttpHost = " + gl.locpickHttpHost)
    } else {
	gl.locpickHttpHost = process.env.LOCPICK_HTTP_HOST
	console.log("log: locpick.js: initEnv(): gl.locpickHttpHost = " + gl.locpickHttpHost)
    }
    
    if(typeof process.env.LOCPICK_GRPC_PORT === 'undefined' || process.env.LOCPICK_GRPC_PORT == "") {
	gl.locpickGrpcPort = 8085
	console.log("log: locpick.js: initEnv(): LOCPICK_GRPC_PORT is undefined, gl.locpickGrpcPort = " + gl.locpickGrpcPort)
    } else {
	gl.locpickGrpcPort = process.env.LOCPICK_GRPC_PORT
	console.log("log: locpick.js: initEnv(): gl.locpickGrpcPort = " + gl.locpickGrpcPort)
    }


    if(typeof process.env.LOCPICK_GRPC_TLS_PORT === 'undefined' || process.env.LOCPICK_GRPC_TLS_PORT == "") {
	gl.locpickGrpcTlsPort = 8090
	console.log("log: locpick.js: initEnv(): LOCPICK_GRPC_TLS_PORT is undefined, gl.locpickGrpcTlsPort = " + gl.locpickGrpcPort)
    } else {
	gl.locpickGrpcTlsPort = process.env.LOCPICK_GRPC_TLS_PORT
	console.log("log: locpick.js: initEnv(): gl.locpickGrpcTlsPort = " + gl.locpickGrpcTlsPort)
    }
    
    if(typeof process.env.LOCPICK_GRPC_HOST === 'undefined' || process.env.LOCPICK_GRPC_HOST == "") {
	gl.locpickGrpcHost = "localhost"
	console.log("log: locpick.js: initEnv(): LOCPICK_GRPC_HOST is undefined, gl.locpickGrpcHost = " + gl.locpickGrpcHost)
    } else {
	gl.locpickGrpcHost = process.env.LOCPICK_GRPC_HOST
	console.log("log: locpick.js: initEnv(): gl.locpickGrpcHost = " + gl.locpickGrpcHost)
    }

    // TLS
    if(typeof process.env.LOCPICK_TLS_SERVER_KEY === 'undefined' || process.env.LOCPICK_TLS_SERVER_KEY == "" ) {
	gl.tlsServerKey = KEY_PATH + "/beatrak-server-key.pem"
	console.log("log: locpick.js: initEnv(): LOCPICK_TLS_SERVER_KEY is undefined, gl.tlsServerKey = ", gl.tlsServerKey)
    } else {
	gl.tlsServerKey = process.env.LOCPICK_TLS_SERVER_KEY
	console.log("log: locpick.js: initEnv(): gl.tlsServerKey = ", gl.tlsServerKey)
    }

    if(typeof process.env.LOCPICK_TLS_SERVER_CERT === 'undefined' || process.env.LOCPICK_TLS_SERVER_CERT == "" ) {
	gl.tlsServerCert = KEY_PATH + "/beatrak-server-cert.pem"
	console.log("log: locpick.js: initEnv(): LOCPICK_TLS_SERVER_CERT is undefined, gl.tlsServerCert = ", gl.tlsServerCert)
    } else {
	gl.tlsServerCert = process.env.LOCPICK_TLS_SERVER_CERT
	console.log("log: locpick.js: initEnv(): gl.tlsServerCert = ", gl.tlsServerCert)
    }

    if(typeof process.env.LOCPICK_TLS_CA_CERT === 'undefined' || process.env.LOCPICK_TLS_CA_CERT == "" ) {
	gl.tlsCaCert = KEY_PATH + "/beatrak-ca-cert.pem"
	console.log("log: locpick.js: initEnv(): LOCPICK_TLS_CA_CERT is undefined, gl.tlsCaCert = ", gl.tlsCaCert)
    } else {
	gl.tlsCaCert = process.env.LOCPICK_TLS_CA_CERT
	console.log("log: locpick.js: initEnv(): gl.tlsCaCert = ", gl.tlsCaCert)
    }

    gl.locpickHttpEndpoint = gl.locpickHttpHost + ":" + gl.locpickHttpPort
    gl.locpickGrpcEndpoint = gl.locpickGrpcHost + ":" + gl.locpickGrpcPort
    gl.locpickGrpcTlsEndpoint = gl.locpickGrpcHost + ":" + gl.locpickGrpcTlsPort
    
}

//
// INIT
//
const init = () => {
    initEnv()
    
    gl.sid = "locpick_" + Math.random().toString(36).substring(8);

    // config inits
    gl.locLast = -1;
    gl.newlocs = [];

    // filter by zone
    gl.locs = gl.config[gl.config.current.type].filter((loc,index) => {
	return loc.zone == gl.config.current.zone;
    })
 
    gl.locMax = gl.locs.length - 1;

    //
    // multiple zones at the same time
    //

    let zones = gl.config["list"].map((loc) => {return loc.zone;}).filter((zone,index,zones) => { 
	return zones.indexOf(zone) == index;
    });

    gl.locmax = {};
    gl.loclast = {};

    // put count for each zone into gl.locmax
    // init(): gl.locmax =  { za: 4, zb: 4, nozone: 1 }
    zones.forEach((zone) => {
	gl.locmax[zone] = gl.config["list"].filter((loc, index, zones) => {
	    //	    log.debug("init(): loc = ", loc);
	    //	    log.debug("init(): index = ", index);
	    return loc.zone == zone;
	}).length;
	gl.loclast[zone] = -1;
    });
    
    log.debug(m("locpick.js: init(): gl.locmax = " + gl.locmax))
    log.debug(m("locpick.js: init(): gl.loclast = " + gl.loclast))
}

//
// GET INFO
//
const getInfo = () => {
    return {
	Name: "locpick",
	SID: gl.sid,
	LocpickID: gl.sid,
	Type: gl.config.current.type,
	Zone: gl.config.current.zone,
    }
}

// HTTP
app.get('/', (req, res) => {
    log.debug(m("locpick.js: {get /}: req: " + req.hostname + "(" + req.ip + "):" + req.originalUrl))
    res.status(200); // may be others later
    utils.sendResponse(res, req, getInfo());
});

// GRPC
const grpcInfo = (call, callback) => {
    log.debug(m("locpick.js: grpcInfo(): call.request = " + JSON.stringify(call.request)))
    callback(null, getInfo());
}


//
// GET LOC
//
const getLoc = (zone) => {
    log.debug(m("locpick.js: getLoc(): starting"))
    log.debug(m("locpick.js: getLoc(): zone = ", zone))

    log.debug(m(`locpick.js: getLoc(): gl.locmax[${zone}] = ${gl.locmax[zone]}`))
    log.debug(m(`locpick.js: getLoc(): gl.loclast[${zone}] = ${gl.loclast[zone]}`))

    var response = {};
    response.Name = "locpick"
    response.SID = gl.sid;
    response.LocpickID = gl.sid;

    let locs = gl.config[gl.config.current.type].filter((loc,index) => {
	return loc.zone === zone;
    })

    // TODO: error if not found
    /*
    log.debug("(PUT /:zone/locs): locs = ", locs);
    log.debug("(PUT /:zone/locs): locs.length = ", locs.length);

    if(locs.length == 0) {
	outer_res.status(400)
	response.error = { "error" : "`(GET /:/zone/reset): zone = ${zone} not found in config`" };
	utils.sendResponse(outer_res, outer_req, response);
	return;
    }
    */
    
    if((gl.loclast[zone] + 1) < gl.locmax[zone]) {
	// new one being generated
	gl.loclast[zone]++
	// TODO: more fields here
	let l = locs[gl.loclast[zone]]
	response.LocName = l.name
	response.LocLonlat = l.lonlat
	response.LocZone = l.zone

	//	gl.newlocs.push(response.loc);
	gl.newlocs.push(l);
	if(gl.loclast[zone] == gl.locmax[zone]) { 
	    // FIRST NOLOCK
	    // this is the last one
	    // we have, should be noloc
	    // consider that it's not ben created
	    // and just return HTTP 200 OK
	    //	    outer_res.status(200);
	    // TODO: grpc status
	} else {
	    // TODO: grpc status
	    // outer_res.status(201);
	}
    } else {
	// ON NOLOCK 
	//response.loc = locs[gl.loclast[zone]]; // we'll keep returning last element which is noloc
	let l = locs[gl.loclast[zone]]
	response.LocName = l.name
	response.LocLonlat = l.lonlat
	response.LocZone = l.zone
	//	gl.newlocs.push(response.loc);
	gl.newlocs.push(l)
	// TODO: grpc status
	//outer_res.status(200); // it's a NOLOCK, but still the call was OK
    }

    log.debug(m("locpick.js: getLoc(): response = ", response))
    
/*    
    return {
	Name: "locpick",
	SID: gl.sid,
	LocpickID: gl.sid,
	Type: gl.config.current.type,
	Zone: gl.config.current.zone,
	LocName: "test-locname",
	LocLonlat: "test-lonlat",
	LocZone: "test-loczone",
    }
*/
    return response
}

const grpcLoc = (call, callback) => {
    log.debug(m("locpick.js: grpcLoc(): call.request = " + JSON.stringify(call.request)))
    callback(null, getLoc(call.request.Zone));
}


// list of new colocations generated so far
app.get('/locs', function (outer_req, outer_res) {
    log.debug(m("locpick.js: {get /locs}: outer_req: " + outer_req.hostname + "(" + outer_req.ip + "):" + outer_req.originalUrl))
    log.debug(m("locpick.js: {get /locs}: gl.locMax = " + gl.locMax))

    var response = {};
    response.sid = gl.sid;
    response.locpickid = gl.sid;
    response.count = gl.newlocs.length;
    response.locs = gl.newlocs;
    gl.newlocs.forEach((loc) =>{
	log.debug("(GET /locs): ", loc);
    });

    outer_res.status(200); // may be others later
    utils.sendResponse(outer_res, outer_req, response);

});

// create (get) a new location in the default zone
app.put('/locs', function (outer_req, outer_res) {
    log.debug("(PUT /locs): outer_req: " + outer_req.hostname + "(" + outer_req.ip + "):" + outer_req.originalUrl);
    log.debug("(PUT /locs): gl.locMax = " + gl.locMax);

    var response = {};
    response.sid = gl.sid;
    response.locpickid = gl.sid;

    gl.locs.forEach((loc) => {
	log.debug("(PUT /locs): ", loc);
    });

    if(gl.locLast < gl.locMax) {
	// new one being generated
	gl.locLast++;
	response.loc = gl.locs[gl.locLast];
	gl.newlocs.push(response.loc);
	if(gl.locLast == gl.locMax) { 
	    // FIRST NOLOCK
	    // this is the last one
	    // we have, should be noloc
	    // consider that it's not ben created
	    // and just return HTTP 200 OK
	    outer_res.status(200);
	} else {
	    outer_res.status(201);
	}
    } else {
	// ON NOLOCK
	response.loc = gl.locs[gl.locLast]; // we'll keep returning last element which is noloc
	gl.newlocs.push(response.loc);
	outer_res.status(200); // it's a NOLOCK, but still the call was OK
    }
    log.debug("(PUT /locs): gl.locLast = ", gl.locLast);

    // all is good
    // we're going to populate newlocs with noloc also for now
    outer_res.status(200); // may be others later
    utils.sendResponse(outer_res, outer_req, response);
});


// create (get) a new location with zone
app.put('/:zone/locs', function (outer_req, outer_res) {
    log.debug("(PUT /:zone/locs): PUT: " + outer_req.hostname + "(" + outer_req.ip + "):" + outer_req.originalUrl);
    log.debug("(PUT /:zone/locs): zone = ", outer_req.params);

    let zone = outer_req.params.zone;
    log.debug(`(PUT /:zone/locs): gl.locmax[${zone}] = ${gl.locmax[zone]}`);
    log.debug(`(PUT /:zone/locs): gl.loclast[${zone}] = ${gl.loclast[zone]}`);

    var response = {};
    response.sid = gl.sid;
    response.locpickid = gl.sid;
 

    // get local locs just for this zone
    let locs = gl.config[gl.config.current.type].filter((loc,index) => {
	return loc.zone === zone;
    })

    log.debug("(PUT /:zone/locs): locs = ", locs);
    log.debug("(PUT /:zone/locs): locs.length = ", locs.length);

    if(locs.length == 0) {
	outer_res.status(400)
	response.error = { "error" : "`(GET /:/zone/reset): zone = ${zone} not found in config`" };
	utils.sendResponse(outer_res, outer_req, response);
	return;
    }

    locs.forEach((loc) => {
	log.debug("(PUT /:zone/locs): loc = ", loc);
    });

    // locmax is "count", loclast is zero based index in
    // config, so need to add + 1
    if((gl.loclast[zone] + 1) < gl.locmax[zone]) {
	// new one being generated
	gl.loclast[zone]++;
	response.loc = locs[gl.loclast[zone]];
	gl.newlocs.push(response.loc);
	if(gl.loclast[zone] == gl.locmax[zone]) { 
	    // FIRST NOLOCK
	    // this is the last one
	    // we have, should be noloc
	    // consider that it's not ben created
	    // and just return HTTP 200 OK
	    outer_res.status(200);
	} else {
	    outer_res.status(201);
	}
    } else {
	// ON NOLOCK 
	response.loc = locs[gl.loclast[zone]]; // we'll keep returning last element which is noloc
	gl.newlocs.push(response.loc);
	outer_res.status(200); // it's a NOLOCK, but still the call was OK
    }

    log.debug(`(PUT /:zone/locs): gl.loclast[${zone}] = ${gl.loclast[zone]}`); 

    // all is good
    // we're going to populate newlocs with noloc also for now
    outer_res.status(200); // may be others later
    utils.sendResponse(outer_res, outer_req, response);
});
 



app.get('/reset', function (outer_req, outer_res, next) {
    log.debug("(GET /reset): outer_req: " + outer_req.hostname + "(" + outer_req.ip + "):" + outer_req.originalUrl);
    log.debug("(GET /reset): locMax = " + gl.locMax);
    log.debug("(GET /reset): need zone:" + outer_req.query.zone);
    
    var response = {};
    response.sid = gl.sid;
    response.locpickid = gl.sid;

    log.debug("(GET /reset): outer_req.query = ", outer_req.query);

    if(typeof outer_req.query.zone !== 'undefined') {
	// secific zone requested
	let hasZone = false;
 
	// check if there is such a zone in the current
	// config
	gl.config["list"].forEach((loc) => { 
	    log.debug("(GET /reset): loc = ", loc);

	    if(loc.zone === outer_req.query.zone) {
		hasZone = true;
	    }
	});

  	if(!hasZone) {
	    // error if requested zone not found in the config list
	    outer_res.status(400)
	    response.error = { "error" : "(GET /reset): zone not found" };

	    // TODO: this will depend on the type of config
	    let unique = gl.config["list"].map((loc) => {return loc.zone;}).filter((zone,index,zones) => { 
		return zones.indexOf(zone) == index;
	    });

	    log.debug("(GET /reset): unique zones = ", unique);
	    response.error.zones = unique;
	    utils.sendResponse(outer_res, outer_req, response);
	} else {
	    gl.config.current.zone = outer_req.query.zone;
	    init();
	    response.name = "locpick";
	    response.sid = gl.sid;
	    response.locpickid = gl.sid;
	    response.type = gl.config.current.type;
	    response.zone = gl.config.current.zone;
	    utils.returnSuccess(outer_res,outer_req,response);  
	}
    } else {
	init();
	response.name = "locpick";
	response.sid = gl.sid;
	response.locpickid = gl.sid;
	response.type = gl.config.current.type;
	response.zone = gl.config.current.zone;
	utils.returnSuccess(outer_res,outer_req,response);  
    }
});


app.get('/config', function (outer_req, outer_res) {
    log.debug("(GET /config): outer_req: " + outer_req.hostname + "(" + outer_req.ip + "):" + outer_req.originalUrl);
    log.debug("(GET /config): gl.locMax = " + gl.locMax);

    var response = {};
    response.sid = gl.sid;
    response.locpickid = gl.sid;

    response.config = gl.config;

    outer_res.status(200);
    utils.sendResponse(outer_res, outer_req, response);
});

const initServers = () => new Promise((resolve,reject) => {

    // HTTP
    // TODO: cdmitri: better error handling
    app.listen(gl.locpickHttpPort, gl.locpickHttpHost)
    
    log.info(m("info: locpick.js: initServers(): OK: locpick HTTP server on http://" + gl.locpickHttpEndpoint))
    
    // GRPC
    // No TLS
    const grpcServer = new grpc.Server();
    grpcServer.addService(locpickProto.Locpick.service, {
	ping: grpcPing,
	info: grpcInfo,
    })

    const cred1 = grpc.credentials.createInsecure()
    const credInsecure = grpc.ServerCredentials.createInsecure()
    const credTls = grpc.ServerCredentials.createSsl(
	fs.readFileSync(gl.tlsCaCert),
	[{
	    private_key: fs.readFileSync(gl.tlsServerKey),
	    cert_chain:  fs.readFileSync(gl.tlsServerCert)
	}], // CN from default example
    )
    
    grpcServer.bind(gl.locpickGrpcEndpoint, credInsecure)
    grpcServer.start()

    if (grpcServer.started == true) {
	log.info(m("info: locpick.js: initServers(): OK: locpick GRPC server on http://" + gl.locpickGrpcEndpoint))
    } else {
	const error = "locpick.js: initServers(): OK: locpick GRPC server on http://" + gl.locpickGrpcEndpoint + " did not start"
	log.error(m("error: " + error))
	reject(error)
    }

    // GPRC TLS
    const grpcTlsServer = new grpc.Server();
    grpcTlsServer.addService(locpickProto.Locpick.service, {
	ping: grpcPing,
	info: grpcInfo,
	loc: grpcLoc,
    })
    
    grpcTlsServer.bind(gl.locpickGrpcTlsEndpoint, credTls)
    grpcTlsServer.start()

    if (grpcTlsServer.started == true) {
	log.info(m("info: locpick.js: initServers(): OK: locpick GRPC TLS server on http://" + gl.locpickGrpcTlsEndpoint))
    } else {
	const error = "locpick.js: initServers(): OK: locpick GRPC TLS server on http://" + gl.locpickGrpcTlsEndpoint + " did not start"
	log.error(m("error: " + error))
	reject(error)
    }

    resolve()
})


//
// MAIN
//
const main = ( async() => {
    init()
    await initServers()
	.catch(error => {
	    log.error("locpick.js: main(): ERROR: could not initServers(), error = ", error)
	})
})

main()
