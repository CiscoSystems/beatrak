/*
 *
 * BEACON
 *
 */


// TODO: cleanup all the inconsistencies with obus.js for testing
//       and locpick

const express = require('express');
const exec = require('child_process').exec;
const execSync = require('child_process').execSync;
const nocache = require('nocache');
const http = require('http');
const elasticsearch = require('elasticsearch');
const moment = require('moment');
const log = require('loglevel');
const axhttp = require("axios");
const {promisify} = require("util");
const utils = require("../common/utils.js");
const m = utils.m
const {sleep,expBackoff} = require("../common/utils.js")
const common = require("../common/common.js")
const grpc = require("grpc")
const getopt = require("node-getopt")
const fs = require("fs")

 
//
// GLOBAL
//
var gl = {}
const PROTO_PATH = __dirname + "/../../../protos"
const KEY_PATH = __dirname + "/../../../keys"
const locpickProto = grpc.load(PROTO_PATH+"/locpick.proto").locpick
const beaconProto = grpc.load(PROTO_PATH+"/beacon.proto").beacon

gl.signal = {};
gl.stage1BaseURL = `http://${common.HOST}:${common.STAGE1_PORT}`
gl.doWriteStage1 = false;
// we're doing load balancing
// so we don't want to wait for too long,
// but wait anywhay incase we have
// a single one with a load
gl.stage1BackoffNumber = 5; // how many cycles/signals to wait until try to reconnect again


//
// ENV
//
var ZONE;
var LOG_LEVEL;
var BEACON_SIG_NUMBER;
var BEACON_SIG_PS;


//
// CONST
//
// elastic does not like - so for beacon that writes to elastic replace it

var BEACON_BACKOFF_SLEEP = 5000;
//var BEACON_SIG_PAUSE = 1000 / BEACON_SIG_PS;
//console.log("env: setting BEACON_SIG_PAUSE = " + BEACON_SIG_PAUSE);

var isLoc = false;
var isElasticReady = false;

// elasticsearch client, make it global since
// we are intializing it in init so that
// it will keep the constant connection

var elastic;

// App 
const app = express();
app.use(nocache());

const initEnv = () => {
    // first init output to console.log on purpose
    // we should always print out the settings
    // to be accessible from kubectl get logs
    if(typeof process.env.LOG_LEVEL === 'undefined' || process.env.LOG_LEVEL == "" ) {
	console.log("log: beacon.js: initEnv(): bLOG_LEVEL is undefined, setting LOG_LEVEL to error");
	log.setLevel("error");
    } else {
	LOG_LEVEL = process.env.LOG_LEVEL;
	log.setLevel(LOG_LEVEL);
	console.log("log: beacon.js: initEnv(): LOG_LEVEL = " + LOG_LEVEL);
    }

    if(typeof process.env.BEACON_SIG_NUMBER === 'undefined' || process.env.BEACON_SIG_NUMBER == "") {
	console.log("log: beacon.js: initEnv(): BEACON_SIG_NUMBER is undefined, setting BEACON_SIG_NUMBER to -1 (infinit)");
	BEACON_SIG_NUMBER = -1;
    } else {
	BEACON_SIG_NUMBER = process.env.BEACON_SIG_NUMBER;
	console.log("log: beacon.js: initEnv(): BEACON_SIG_NUMBER = " + BEACON_SIG_NUMBER);
    }
    
    if(typeof process.env.BEACON_SIG_PS === 'undefined' || process.env.BEACON_SIG_PS == "") {
	console.log("log: beacon.js: initEnv(): BEACON_SIG_PS is undefined, setting BEACON_SIG_PS to 1 (1 per second)");
	BEACON_SIG_PS = 1;
    } else {
	BEACON_SIG_PS = process.env.BEACON_SIG_PS;
	console.log("log: beacon.js: initEnv(): BEACON_SIG_PS = " + BEACON_SIG_PS);
    }

    if(typeof process.env.ZONE === 'undefined' || process.env.ZONE == "") {
	console.log("log: beacon.js: initEnv(): ZONE is undefined, setting ZONE to \"nozone\"");
	ZONE = "nozone"
	gl.zone = ZONE
    } else {
	ZONE = process.env.ZONE;
	gl.zone = ZONE
	console.log("log: beacon.js: initEnv(): ZONE = " + gl.zone);
    }

    if(typeof process.env.ZONE === 'undefined' || process.env.ZONE == "") {
	gl.zone = "nozone"
	console.log("log: beacon.js: initEnv(): ZONE is undefined, gl.zone = ", gl.zone)
    } else {
	gl.zone = process.env.ZONE
	console.log("log: beacon.js: initEnv(): gl.zone = " + gl.zone);
    }

    
    // GL CONFIG
    if(typeof process.env.SERVICE_NAME === 'undefined' || process.env.SERVICE_NAME == "") {
	gl.serviceName = "beacon";
	console.log("log: beacon.js: initEnv(): SERVICE_NAME is undefined, setting gl.serviceName = " + gl.serviceName)
    } else {
	gl.serviceName = process.env.SERVICE_NAME;
	console.log("log: beacon.js: initEnv(): gl.serviceName = " + gl.serviceName)
    }

    
    if(typeof process.env.LOCPICK_HTTP_PORT === 'undefined' || process.env.LOCPICK_HTTP_PORT == "") {
	gl.locpickHttpPort = 8080
	console.log("log: beacon.js: initEnv(): LOCPICK_HTTP_PORT is undefined, gl.locpickHttpPort = " + gl.locpickHttpPort)
    } else {
	gl.locpickHttpPort = process.env.LOCPICK_HTTP_PORT
	console.log("log: beacon.js: initEnv(): gl.locpickHttpPort = " + gl.locpickHttpPort)
    }

    if(typeof process.env.LOCPICK_HTTP_HOST === 'undefined' || process.env.LOCPICK_HTTP_HOST == "") {
	gl.locpickHttpHost = "localhost"
	console.log("log: beacon.js: initEnv(): LOCPICK_HTTP_HOST is undefined, gl.locpickHttpHost = " + gl.locpickHttpHost)
    } else {
	gl.locpickHttpHost = process.env.LOCPICK_HTTP_HOST
	console.log("log: beacon.js: initEnv(): gl.locpickHttpHost = " + gl.locpickHttpHost)
    }
    
    if(typeof process.env.LOCPICK_GRPC_PORT === 'undefined' || process.env.LOCPICK_GRPC_PORT == "") {
	gl.locpickGrpcPort = 8085
	console.log("log: beacon.js: initEnv(): LOCPICK_GRPC_PORT is undefined, gl.locpickGrpcPort = " + gl.locpickGrpcPort)
    } else {
	gl.locpickGrpcPort = process.env.LOCPICK_GRPC_PORT
	console.log("log: beacon.js: initEnv(): gl.locpickGrpcPort = " + gl.locpickGrpcPort)
    }

    if(typeof process.env.LOCPICK_GRPC_HOST === 'undefined' || process.env.LOCPICK_GRPC_HOST == "") {
	gl.locpickGrpcHost = "localhost"
	console.log("log: beacon.js: initEnv(): LOCPICK_GRPC_HOST is undefined, gl.gl.locpickGrpcHost = " + gl.gl.locpickGrpcHost)
    } else {
	gl.locpickGrpcHost = process.env.LOCPICK_GRPC_HOST
	console.log("log: beacon.js: initEnv(): gl.locpickGrpcHost = " + gl.locpickGrpcHost)
    }
    

    if(typeof process.env.LOCPICK_GRPC_TLS_PORT === 'undefined' || process.env.LOCPICK_GRPC_TLS_PORT == "") {
	gl.locpickGrpcTlsPort = 8090
	console.log("log: beacon.js: initEnv(): LOCPICK_GRPC_TLS_PORT is undefined, gl.locpickGrpcTlsPort = " + gl.locpickGrpcPort)
    } else {
	gl.locpickGrpcTlsPort = process.env.LOCPICK_GRPC_TLS_PORT
	console.log("log: beacon.js: initEnv(): gl.locpickGrpcTlsPort = " + gl.locpickGrpcTlsPort)
    }
    
    if(typeof process.env.LOCPICK_GRPC_HOST === 'undefined' || process.env.LOCPICK_GRPC_HOST == "") {
	gl.locpickGrpcHost = "localhost"
	console.log("log: beacon.js: initEnv(): LOCPICK_GRPC_HOST is undefined, gl.locpickGrpcHost = " + gl.locpickGrpcHost)
    } else {
	gl.locpickGrpcHost = process.env.LOCPICK_GRPC_HOST
	console.log("log: beacon.js: initEnv(): gl.locpickGrpcHost = " + gl.locpickGrpcHost)
    }

    gl.locpickHttpEndpoint = gl.locpickHttpHost + ":" + gl.locpickHttpPort
    console.log("log: beacon.js: initEnv(): gl.locpickHttpEndpoint = " + gl.locpickHttpEndpoint)
    gl.locpickGrpcEndpoint = gl.locpickGrpcHost + ":" + gl.locpickGrpcPort
    console.log("log: beacon.js: initEnv(): gl.locpickGrpcEndpoint = " + gl.locpickGrpcEndpoint)
    gl.locpickGrpcTlsEndpoint = gl.locpickGrpcHost + ":" + gl.locpickGrpcTlsPort
    console.log("log: beacon.js: initEnv(): gl.locpickGrpcTlsEndpoint = " + gl.locpickGrpcTlsEndpoint)


    //
    // TLS SECRETS
    //
    // TODO: change to locpickCaCert, locpickKey, locpickCert


    if(typeof process.env.LOCPICK_TLS_CA_CERT === 'undefined' || process.env.LOCPICK_TLS_CA_CERT == "" ) {
	// TODO: if KEY_PATH does not exist
	// we don't get the error up the async chain
	// find out a better way to handle errors

	gl.locpickTlsCaCert = KEY_PATH + "/ca-crt.pem"
	console.log("log: beacon.js: initEnv(): LOCPICK_TLS_CA_CERT is undefined, gl.locpickTlsCaCert = ", gl.locpickTlsCaCert)
    } else {
	gl.locpickTlsCaCert = process.env.LOCPICK_TLS_CA_CERT
	console.log("log: beacon.js: initEnv(): gl.locpickTlsCaCert = ", gl.locpickTlsCaCert)
    }

    if(typeof process.env.LOCPICK_TLS_CLIENT_KEY === 'undefined' || process.env.LOCPICK_TLS_CLIENT_KEY == "" ) {
	gl.locpickTlsClientKey = KEY_PATH + "/client1-key.pem"
	console.log("log: beacon.js: initEnv(): LOCPICK_TLS_CLIENT_KEY is undefined, gl.locpickTlsClientKey = ", gl.locpickTlsClientKey)
    } else {
	gl.locpickTlsClientKey = process.env.LOCPICK_TLS_CLIENT_KEY
	console.log("log: beacon.js: initEnv(): gl.locpickTlsClientKey = ", gl.locpickTlsClientKey)
    }

    if(typeof process.env.LOCPICK_TLS_CLIENT_CERT === 'undefined' || process.env.LOCPICK_TLS_CLIENT_CERT == "" ) {
	gl.locpickTlsClientCert = KEY_PATH + "/client1-cert.pem"
	console.log("log: locpick.js: initEnv(): LOCPICK_TLS_CLIENT_CERT is undefined, gl.locpickTlsClientCert = ", gl.locpickTlsClientCert)
    } else {
	gl.locpickTlsClientCert = process.env.LOCPICK_TLS_CLIENT_CERT
	console.log("log: locpick.js: initEnv(): gl.locpickTlsClientCert = ", gl.locpickTlsClientCert)
    }
    
}

const initOps = () => {
    gl.opt = getopt.create([
	["", "grpc", "long grpc option"],
	["", "tls", "long tls option"],
	["h", "help", "display this help"],
    ])
    .bindHelp()
    .parseSystem()
}


const initLocpick = () => {

    gl.locpickGrpcClient = new locpickProto.Locpick(gl.locpickGrpcEndpoint,
    						    grpc.credentials.createInsecure())

    if(gl.opt.options.tls) {
	log.debug(m("beacon.js: initLocpick(): TLS on"))

	const channelCredsTls = grpc.credentials.createSsl(
	    fs.readFileSync(gl.locpickTlsCaCert),
	    fs.readFileSync(gl.locpickTlsClientKey),
	    fs.readFileSync(gl.locpickTlsClientCert),
	)

	// ChannelChredentials does not have stringified, always {}
	log.debug(m("beacon.js: initLocpick(): channelCredsTls = ", channelCredsTls))

       // TODO: better error here if can't connect
	gl.locpickGrpcTlsClient = new locpickProto.Locpick(gl.locpickGrpcTlsEndpoint,
        						   channelCredsTls)

	log.debug(m("beacon.js: initLocpick(): gl.locpickGrpcTlsClient = ", gl.locpickGrpcTlsClient))
    }
}


const locpickHttpInfo = ( async(label) => {

    var info

    await axhttp.get("http://" + gl.locpickHttpEndpoint).then(response => {
	log.debug(m("beacon.js: initHttpInfo(): locpick response.data =>\n"))
	log.debug(JSON.stringify(response.data, null, "\t"));
	log.debug(m("beacon.js: initHttpInfo(): locpick response.status = ", response.status))
	log.debug(m("beacon.js: initHttpInfo(): locpick response.statusText = ", response.statusText));

	info = response.data

    }).catch(error => {
	log.error(m("beacon.js: init(): locpick catch(): GET url = "), url);
	log.error(m("beacon.js: init(): locpick catch(): could not call locpick, error.message = ", error.message));
	if(error.response) {
	    log.error(m("beacon.js: init(): locpick catch(): error.response.data =>\n"));
	    log.error(JSON.stringify(error.response.data, null, "\t"));
	    log.error(m("beacon.js: init(): locpick catch(): error.response.status = ", error.response.status));
	 }
	 log.debug(m("beacon.js: init(): locpick catch(): exit(1)"));
	 process.exit(1)
    })

    return info

})


const locpickGrpcInfo = (label) => new Promise((resolve, reject) => {
    gl.locpickGrpcClient.info({ClientID: gl.sid, Label: label}, (error, response) => {
	if(error) {
	    log.debug(m("beacon.js: locpickGrpcInfo(): ERROR:  gl.locpickGrpcClient.info(): error = " + error))
	    reject(error)
	} else {
	    log.debug(m("beacon.js: locpickGrpcInfo(): OK: gl.locpickGrpcClient.info(): received response = " + JSON.stringify(response)))
	    resolve(response)
	}
    })
})

const locpickGrpcTlsInfo = (label) => new Promise((resolve, reject) => {
    gl.locpickGrpcTlsClient.info({ClientID: gl.sid, Label: label}, (error, response) => {
	if(error) {
	    log.debug(m("beacon.js: locpickGrpcInfo(): ERROR:  gl.locpickGrpcTlsClient.info(): error = " + error))
	    reject(error)
	} else {
	    log.debug(m("beacon.js: locpickGrpcInfo(): OK: gl.locpickGrpcTlsClient.info(): received response = " + JSON.stringify(response)))
	    resolve(response)
	}
    })
})

const getLoc = (zone, label) => new Promise((resolve, reject) => {
    if(gl.opt.options.grpc && gl.opt.options.tls ) {
	log.debug(m("beacon.js: getLoc(): GRPC TLS get location for gl.zone = ", gl.zone))

	gl.locpickGrpcTlsClient.loc({ClientID: gl.sid, Label: label, Zone: zone}, (error, response) => {
	    if(error) {
		log.debug(m("beacon.js: getLoc(): ERROR:  gl.locpickGrpcTlsClient.info(): error = " + error))
		reject(error)
	    } else {
		log.debug(m("beacon.js: getLoc(): OK: gl.locpickGrpcTlsClient.info(): received response = " + JSON.stringify(response)))
		resolve(response)
	    }
	})
	
	log.debug(m("beacon.js: getLoc(): GRPC TLS after Loc call"))
    } else {
	log.warn(m("beacon.js: WARNING: getLoc(): combination of grpc and tls is not implemeted for getting location, deferring to plain HTTP"))
	// TODO: do http call here
	let loc = {"name" : "brussels", "lonlat" : "50.8386789,4.2931938", "zone" : "za"}
	resolve(loc)
    }
}) // promise

const init = (async () => {
    BEACON_SIG_PAUSE = 1000 // DEBUG:

    initEnv()
    initOps()
    initLocpick()

    BEACON_SIG_PAUSE = 1000 / BEACON_SIG_PS;

    // HTTP
    var info = await locpickHttpInfo("http-info-for-beacon")
    // do not pretty the output
    log.debug(m("beacon.js: init(): http info = " + JSON.stringify(info)))

    if (info.Name == "locpick") {
	log.info(m("beacon.js: init(): OK: locpick http info"))
    } else {
	log.error(m("beacon.js: init(): ERROR: locpick http info"))
    }

    // GRPC
    info = await locpickGrpcInfo("http-grpc-tls-info-for-beacon")
    log.debug(m("beacon.js: init(): grpc info = " + JSON.stringify(info)))

    if (info.Name == "locpick") {
	log.info(m("beacon.js: init(): OK: locpick grpc info"))
    } else {
	log.error(m("beacon.js: init(): ERROR: locpick grpc info"))
    }


    // TLS
    if(gl.opt.options.tls) {
	info = await locpickGrpcTlsInfo("grpc-tls-info-for-beacon")
	log.debug(m("beacon.js: init(): grpc tls info = " + JSON.stringify(info)))

	if (info.Name == "locpick") {
	    log.info(m("beacon.js: init(): OK: locpick grpc tls info"))
	} else {
	    log.error(m("beacon.js: init(): ERROR: locpick grpc tls info"))
	}
	
    }
    

    initServers()

    const loc = await getLoc(gl.zone, "get-loc-from-beacon-test")
    log.debug(m("beacon.js: init(): loc = " + JSON.stringify(loc)))
    if (loc.Name == "locpick") {
	log.info(m("beacon.js: init(): OK: locpick location"))
    } else {
	log.info(m("beacon.js: init(): ERROR: locpick location"))
    }
    
    // fill out the signal that we'll use later
    gl.sid = gl.serviceName.replace(/-/gi,"_") + "_" + Math.random().toString(36).substring(8) + "_" + ZONE
    gl.signal.locpickid = info.locpickid
    gl.signal.beaconid = gl.sid
    gl.signal.beaconzone = ZONE
    gl.signal.loc = info.loc
    log.debug(m("beacon.js: init(): gl.signal = " + JSON.stringify(gl.signal)))
})

const init_old_2 = (async () => {
    log.console("debug: beacon.js: init(): before initEnv()")
    initEnv()
    log.console("debug: beacon.js: init(): after initEnv()")

    gl.opt = getopt.create([
	["", "tls", "long tls option"],
	["h", "help", "display this help"],
    ])
        .bindHelp()
	.parseSystem()
    

    log.console("debug: beacon.js: init(): before initLocpick()")
    initLocpick()
    log.console("debug: beacon.js: init(): after initLocpick()")
    initServers()

    const sid = gl.serviceName.replace(/-/gi,"_") + "_" + Math.random().toString(36).substring(8) + "_" + ZONE
    gl.sid = sid
    log.debug(m(`debug: beacon.js: init(): sid = ${sid}`));
    BEACON_SIG_PAUSE = 1000 / BEACON_SIG_PS;
    log.debug(m("debug: beacon.js: init(): setting BEACON_SIG_PAUSE = ", BEACON_SIG_PAUSE));

    //
    // LOCPICK HTTP INFO
    //
    locpickURL = `http://${gl.locpickHttpEndpoint}`
    log.debug(m("beacon.js: init(): locpickURL = ", locpickURL))

    await axhttp.get(locpickURL).then(response => {
	log.debug(m("beacon.js: init(): locpick response.data =>\n"))
	log.debug(JSON.stringify(response.data, null, "\t"));
	log.debug(m("beacon.js: init(): locpick response.status = ", response.status))
	log.debug(m("beacon.js: init(): locpick response.statusText = ", response.statusText));
	log.info(m("beacon.js: beacon.js: init(): OK: locpick http info response status = ", response.status))
	
	// fill out the signal that we'll use later
	gl.signal.locpickid = response.data.locpickid
	gl.signal.beaconid = `${sid}`
	gl.signal.beaconzone = ZONE
	gl.signal.loc = response.data.loc

    }).catch(error => {
	log.error(m("beacon.js: init(): locpick catch(): GET url = "), url);
	log.error(m("beacon.js: init(): locpick catch(): could not call locpick, error.message = ", error.message));
	if(error.response) {
	    log.error(m("beacon.js: init(): locpick catch(): error.response.data =>\n"));
	    log.error(JSON.stringify(error.response.data, null, "\t"));
	    log.error(m("beacon.js: init(): locpick catch(): error.response.status = ", error.response.status));
	 }
	 log.debug(m("beacon.js: init(): locpick catch(): exit(1)"));
	 process.exit(1);
     })
    // TODO: cleanup multiple await handling
    //       either return value or then
    //       var info = await locpickGrpcInfo(gl.locpickGrpcClient)
    //
    // LOCPICK GRPC INFO
    //
    await locpickGrpcInfo(gl.locpickGrpcClient)
	.then(info => {
	    if(info.Name == "locpick") {
		log.info(m("beacon.js: init(): OK: locpick grpc info, info = ", info))
		gl.LocpickID = info.LocpickID
	    }

	})
	.catch(error => {
	    log.error(m("beacon.js: init(): ERROR: locpick grpc info, error = ", error))
	})
})


// we need init() to be async() so that we can do await inside
const init_old = (async () => {
    initEnv()
    const sid = gl.serviceName.replace(/-/gi,"_") + "_" + Math.random().toString(36).substring(8) + "_" + ZONE 

    log.debug(m(`debug: beacon.js: init(): sid = ${sid}`));
    BEACON_SIG_PAUSE = 1000 / BEACON_SIG_PS;
    log.debug(m("debug: beacon.js: init(): setting BEACON_SIG_PAUSE = ", BEACON_SIG_PAUSE));

//    gl.locpickHttpEndpoint = `${gl.locpickHttpHost}:${gl.locpickHttpPort}`
//    log.debug(m("debug: beacon.js: init(): gl.locpickHttpEndpoint = ", gl.locpickHttpEndpoint))
//    gl.locpickGrpcEndpoint = `${gl.locpickGrpcHost}:${gl.locpickGrpcPort}`
//    log.debug(m("debug: beacon.js: init(): gl.locpickGrpcEndpoint = ", gl.locpickGrpcEndpoint))

    
    //    var locpickURL = `http://${common.HOST}:${common.LOCPICK_PORT}/${ZONE}/locs?pretty`

    
    // NEXT: see what kind of zone we can do
    locpickURL = `http://${gl.locpickHttpEndpoint}/${ZONE}/locs?pretty`
    log.debug(moment().format('YYYY-MM-DDTHH:mm:ssZ') + " init(): locpickURL = ", locpickURL);

    let url = locpickURL;
    await axhttp.put(url).then(response => {
	log.debug(m("init(): locpick response.data =>\n"))
	log.debug(JSON.stringify(response.data, null, "\t"));
	log.debug(m("init(): locpick response.status = ", response.status))
	log.debug(m("init(): locpick response.statusText = ", response.statusText));
	log.info(m("beacon.js: init(): OK: locpick http info response status = ", response.status))
	
	// fill out the signal that we'll use later
	gl.signal.locpickid = response.data.locpickid;
	gl.signal.beaconid = `${sid}`;
	gl.signal.beaconzone = ZONE;
	gl.signal.loc = response.data.loc;

    }).catch(error => {
	log.error(m("init(): locpick catch(): GET url = "), url);
	log.error(m("init(): locpick catch(): could not call locpick, error.message = ", error.message));
	if(error.response) {
	    log.error(m("init(): locpick catch(): error.response.data =>\n"));
	    log.error(JSON.stringify(error.response.data, null, "\t"));
	    log.error(m("init(): locpick catch(): error.response.status = ", error.response.status));
	 }
	 log.debug(m("init(): locpick catch(): exit(1)"));
	 process.exit(1);
    });


    elastic = new elasticsearch.Client({
	host: common.HOST + ":" + common.ELASTIC_PORT,
	log: "error"
	// log: LOG_LEVEL,
	// pingTimeout: 1000,
	// requestTimeout: 1000, // when to report an error
	// deadTimeout: 1000,
	// maxRetries: 0 // this does work
    });


    let hasElastic = false;
    while(!hasElastic) {
	await elastic.ping({
	    requestTimeout: 1000,
	    maxRetries: 0 // control the retries in this loop
	}).then(() => {
	    log.debug(m("init(): elastic.ping(): success"));
	    hasElastic = true;
	}, (error) => {
	    log.debug(m("init(): elastic.ping(): failed"));
	});
	await sleep(1000);
    }

    //
    // create index (if necessary)
    //
    log.debug(m("init(): create /beacon index..."));
    await elastic.indices.create({  
	index: "beacon",
	body: {
	    "settings" : {
		"number_of_shards" : 2,
		"number_of_replicas" : 1
	    },
	    "mappings" : {
		"explicit_types" : {
		    "properties": {
			"loc.name": {
			    "type":"text",
			    "fielddata":true
			},
			"beaconid": {
			    "type":"text",
			    "fielddata":true
			}
		    }
		}
	    }
	}
    })
	.then((response,status) => {
	    log.debug(m("init(): elastic.indices.create(): response =>"));
	    log.debug(response);
	    log.debug(m("init(): elastic.indices.create(): status =>"));
	    log.debug(status);
	}, error => {
	    try {
		if(typeof error.response === 'undefined') {
		    log.debug(m("init(): elastic.indices.create(): got and undefined error.response"));
		} else {
		    JSON.parse(error.response);
		    let response  = JSON.parse(error.response);
		    if(response.error.type === "index_already_exists_exception") {
			log.debug(m("init(): elastic.indices.create(): error(OK): index already exits, continue..."));
		    } else {
			log.debug(m("init(): elastic.indices.create(): error: got JSON response but unknown error.response =>"));
			log.debug(error.response);
		    }
		}
	    } catch (error) {
		log.debug(m("init(): elastic.indices.create(): error: catch(): not a JSON error =>"));
		log.debug(error);
		log.debug(m("init(): elastic.indices.create(): error: catch(): this is a serious error, exit(1)"));
		//process.exit(1);
	    }
	})
	.catch (error => {
	    log.debug(m("init(): elastic.indices.reate(): catch(): unkown general error =>"));
	    log.debug(error);
	});
  
    let record = {index: "beacon", type: "init"};
    record.body = gl.signal;
    record.body.timestamp = moment().format('YYYY-MM-DDTHH:mm:ssZ');
    log.debug(m("init(): init record write: record = ", record));

    //
    // check stage1 to forward the signal to
    //
    await pingStage1()
    .then ((response) => {
	log.debug(m("init(): OK: can reach stage1"));
	log.debug(m("init(): OK: response =>"));
	log.debug(response);
	gl.doWriteStage1 = true;
    })
    .catch (error => {
	log.error(m("init(): ERROR: can't reach stage1, error =>"));
	log.error(error);
	gl.doWriteStage1 = false;
	//process.exit(1);
    });


    //
    // write init record
    //
    await elastic.index(record)
	.then((response) => {
	    log.debug(m("init(): elastic.index(): response =>"));
	    log.debug(response);
	}, error => {
	    try {
		// if the response not jason we'll be in catch
		// JSON.parse(error); 
		let response  = JSON.parse(error.response);
		log.debug(m("init(): elastic.index(): error: got JSON response but unknown error =>"));
		log.debug(error);
		log.debug(m("init(): elastic.index(): error: this is a serious error, exit(1)"));
		process.exit(1);
	    } catch (error) {
		log.debug(m("init(): elastic.index(): error: catch(): not a JSON error =>"));
		log.debug(error);
		log.debug(m("init(): elastic.index(): error: catch(): this is a serious error, exit(1)"));
		process.exit(1);
	    } 
	})
	.catch(error => {
	    log.debug(m("init(): elastic.index(): catch(): unkown general error =>"));
	    log.debug(error);
	});

    let ms = await expBackoff(1,1000); //sleep for 1000ms 

    log.debug(m(`init(): waited for ${ms}(ms) before init finish`));   

});


const initServers = () => {
    // HTTP
    try {
	app.listen(common.LOCAL_SERVER_PORT, common.HOST);
	log.info(m(`beacon.js: initServers(): OK: ${gl.serviceName} HTTP server on http://${common.HOST}:${common.LOCAL_SERVER_PORT}`))} catch (error) {
	    log.info(m(`beacon.js: initServers(): ERROR: ${gl.serviceName} HTTP server on http://${common.HOST}:${common.LOCAL_SERVER_PORT}`))
	}
    
    // GRPC
    const grpcServer = new grpc.Server();
    grpcServer.addService(beaconProto.Beacon.service, {
	ping: grpcInfo,
	info: grpcInfo,
    })

    // TODO: get another endpoint
    gl.beaconGrpcEndpoint = "localhost:8085"

    grpcServer.bind(gl.beaconGrpcEndpoint, grpc.ServerCredentials.createInsecure())
    grpcServer.start()

    // TODO: cdmitri: dig into the wrapper code,
    //       there should be a better way to detect
    //       errors here, right now nothing
    //       is thrown
    if (grpcServer.started == true) {
	log.info(m("beacon.js: initServers(): OK: beacon GRPC server on http://" + gl.beaconGrpcEndpoint))
    } else {
	log.error(m("beacon.js: initServers(): ERROR: beacon GRPC server on http://" + gl.beaconGrpcEndpoint + " did not start"))
    }

}

//
// GRPC
//
const locpickGrpcInfo_old = (grpcClient) => new Promise((resolve,reject) => {
    clientLabel = "test-label"
    grpcClient.info({ClientID: gl.sid, Label: clientLabel}, (error, response) => {
	if(error) {
	    log.debug(m("beacon.js: locpickGrpcInfo(): ERROR:  client.info(): error = " + error))
	    reject(error)
	} else {
	    log.debug(m("beacon.js: locpickGrpcInfo(): OK: grpcClient.info(): received response = " + JSON.stringify(response)))
	    resolve(response)
	}
    })
})


//
// HTTP
//
// we need init() to be async() so that we can do await inside
//const pingStage1 = (async () => {
//    return new Promise((resolve,reject) => {
const pingStage1 = () => {
    return new Promise( async(resolve,reject) => {
	log.debug(m("pingStage1(): starting..."));
	log.debug(moment().format('YYYY-MM-DDTHH:mm:ssZ') + " pingStage1(): gl.stage1BaseURL = " + gl.stage1BaseURL);

	await axhttp.get(gl.stage1BaseURL).then(response => {
	    log.debug(m("pingStage1(): stage1 response.data =>\n"))
	    log.debug(JSON.stringify(response.data, null, "\t"));
	    log.debug(m("pingStage1(): stage1 response.status = ", response.status))
	    log.debug(m("pingStage1(): stage1 response.statusText = ", response.statusText));
	    resolve("OK resolve");
	}).catch(error => {
	    log.error(m("pingStage1(): stage1 catch(): GET gl.stage1BaseURL = " + gl.stage1BaseURL));
	    log.error(m("pingStage1(): stage1 catch(): could not call stage1, error.message = " + error.message));
	    if(error.response) {
		log.error(m("pingStage1(): stage1 catch(): error.response.data =>\n"));
		log.error(JSON.stringify(error.response.data, null, "\t"));
		log.error(m("pingStage1(): stage1 catch(): error.response.status = ", error.response.status));
	    }
	    reject("ERROR from reject");
	});
    }); // promise
}; // proc


const sendToStage1 = (baseURL, signal) => {
    return new Promise( async(resolve, reject) => {
	//	log.trace(m("sendToStage1(): starting..."));
	log.trace(m("sendToStage1(): starting..."));
	let url = `${baseURL}/${signal.beaconzone}/signal/?pretty`;
	log.trace(m(`sendToStage1(): url = ${url}`))
        log.trace(signal);

  	await axhttp.put(url, signal)
	    .then(response => { 
		log.trace(m("sendToStage1(): response.data =>"));
		log.trace(response.data);
		log.trace(m("sendToStage1(): response.status =>"));
		log.trace(response.status);
		log.trace(m("sendToStage1(): response.statusText =>"));
		log.trace(response.statusText);
		log.trace(m("sendToStage1(): headers =>"));
		log.trace(response.headers);
		log.trace(m("sendToStage1(): config =>"));
		log.trace(response.config);
		resolve("sendToStage1(): resolve OK");
	    })
	    .catch(error => {   
		log.debug(m("sendToStage1(): ERROR: in the catch pinging url = " + url));
		log.debug(m("sendToStage1(): ERROR: error =>"));
		log.debug(error);
//		log.debug(m("sendToStage1(): ERROR: error.response.data.error.error =>"));
//		log.debug(error.response.data.error.error);  
		if(typeof error.response.data === 'undefined') {
		    log.debug(m("sendToStage1(): ERROR: envoy upstream must be done, reponse = " + response));
		    reject("sendToStage1(): ERROR: evnoy upstream problem, response = " + response);
		} else {
		    log.debug(m("sendToStage1(): ERROR: error.response.data =>"));
		    log.debug(error.response.data);
		    log.trace(m("sendToStage1(): ERROR: "));
		    log.trace(error); 
		    reject("sendToStage1(): rejecet ERROR");
		}
	    });
    }); // promise
}; // proc


//
// GET INFO
//
const getInfo = () => {
    return {
	Name: gl.serviceName,
	SID: gl.sid,
	LocpickID: gl.LocpickID,
	Type: "NA",
	Zone: gl.zone,
    }
}

// HTTP
app.get('/', (req, res) => {
    log.debug("beacon.js: {get /}: req: " + req.hostname + "(" + req.ip + "):" + req.originalUrl);
    res.status(200); // may be others later
    utils.sendResponse(res, req, getInfo());
});

// GRPC
const grpcInfo = (call, callback) => {
    callback(null, getInfo());
}



//
// REST
//
app.get("/", (outer_req, outer_res) => {
    log.debug("outer_req: " + outer_req.hostname + "(" + outer_req.ip + "):" + outer_req.originalUrl);

    var response = {};
    response.name = gl.serviceName; 
    response.sid = gl.sid;
    response.beaconid = gl.sid;
    response.signal = gl.signal;


    if(typeof outer_req.query.pretty !== 'undefined') {
	outer_res.send(JSON.stringify(response, null, "\t"));
    } else {
	outer_res.send(JSON.stringify(response));
    }

});

//
// MAIN
//
const main = (async () => {
    await init()
	.catch(error => {
	    log.error(m("beacon.js: main(): could not init(), error = ", error))
	    process.exit(1);
	}) 

    console.log("debug: beacon.js: main(): after init()")
    
    log.info(m("beacon.js: main(): OK: init done"))
    while(true) {
	log.info(m("beacon.js: main(): sleeping..."));
	await sleep(BEACON_SIG_PAUSE);
    }

    log.info(m("beacon.js: main(): done"))
    
})

main()


/*

//
// MAIN LOOP
//
(async () => {
    let signalCount = -1;
    let isElasticReady = false;
    let doBackoff = false;
    let record;
    let stage1BackoffCount = 0;

    await init()

    //
    // signal loop
    //
    log.debug(m(`init(): signal loop: starting loop: signalCount = ${signalCount}, BEACON_SIG_NUMBER = ${BEACON_SIG_NUMBER}, BEACON_SIG_PAUSE = ${BEACON_SIG_PAUSE}`));
    while(BEACON_SIG_NUMBER == -1 || signalCount++ < BEACON_SIG_NUMBER - 1) {
	log.trace(m(`init(): signal loop: signalCount = ${signalCount}, BEACON_SIG_NUMBER = ${BEACON_SIG_NUMBER}, BEACON_SIG_PAUSE = ${BEACON_SIG_PAUSE}`));

	if(doBackoff) {
	    isElasticReady = false;
	    let backoffCount = 1;
	    let backoffMS = 0;
	    while(!isElasticReady) {
		log.debug(m(`signal loop: backoff loop: backoff for ${BEACON_BACKOFF_SLEEP}(ms)`));
		await expBackoff(backoffCount, BEACON_BACKOFF_SLEEP)
		.then((ms) => {
		    log.debug(m("signal loop: backoff loop: expBackoff() done"));
		    log.debug(m(`signal loop: backoff loop: expBackoff() waited for ${ms}(ms)`));
		    // process.exit(1);
		    backoffMS += ms;
		})
		.catch(error => {
		    log.error(m("signal loop: backoff loop: expBackoff() error =>"));
		    log.error(error);
		    process.exit(1);
		}); 

		await elastic.ping({
		    requestTimeout: 1000,
		    maxRetries: 0 // control the retries in this loop
		}).then(() => {
		    log.debug(m("signal loop: backoff loop: elastic.ping(): success"));
		    isElasticReady = true;
		}, (error) => {
		    log.debug(m("signal loop: backoff loop: elastic.ping(): failed"));
		    isElasticReady = false;
		});
	    }

	    // write a backoff record
	    record = {index: "beacon", type: "backoff"};
	    record.body = gl.signal;
	    record.body.timestamp = moment().format('YYYY-MM-DDTHH:mm:ssZ');
	    record.body.backoffSeconds = backoffMS / 1000;
	    log.trace(m("signal loop: backoff record write: record = ", record));

	    //
	    // write backoff record
	    //
	    await elastic.index(record)
		.then((response, status) => {
		    log.debug(m("signal loop: OK: wrote backoff record: elastic.index(): response =>"));
		    log.debug(response);
		    log.debug(m("signal loop: OK: wrote backoff record: elastic.index.create(): status =>"));
		    doBackoff = false;
		})
		.catch(error => {
		    log.debug(m("signal loop: ERROR: couldn't write backoff record: elastic.index(): catch(): unkown general error =>"));
		    log.debug(error);
		    log.debug(m("signal loop: ERROR: couldn't write backoff record: elastic.index(): catch(): do backoff"));
		    doBackoff = true;
		});
	} else {

	    gl.signal.beacon_timestamp = moment().format('YYYY-MM-DDTHH:mm:ssZ');

	    //
	    // send signal to stage1
	    //
	    if(gl.doWriteStage1) {
		await sendToStage1(gl.stage1BaseURL, gl.signal)
		    .then(response => {
		    })
		    .catch(error => {
			//log.debug(m("signal loop: ERROR: couldn't write stage1 record: catch(): unkown general error =>"));
			log.debug(m(`signal loop: ERROR: couldn't write stage1 record: catch(): skip/backoff => ${gl.stage1BackoffNumber} cycles`));
			//log.debug(error);
			gl.doWriteStage1 = false;
		    });
	    } else {
		    // log.debug(m("signal loop: ERROR: Stage1 is not reachable, skip."));
		if(gl.stage1BackoffNumber > stage1BackoffCount) {
		    stage1BackoffCount++;
		    //log.debug(m(`signal loop: ERROR: gl.stage1BackoffNumber = ${gl.stage1BackoffNumber}`));
		    //log.debug(m(`signal loop: ERROR: stage1BackoffCount = ${stage1BackoffCount}`));
		} else {
		    stage1BackoffCount = 0;
		    gl.doWriteStage1 = true;
		}
	    }

	    //
	    // write signal record
	    //
	    gl.signal.timestamp = gl.signal.beacon_timestamp;
	    record = {index: "beacon", type: "signal"};
	    record.body = gl.signal;
	    log.trace(m("signal loop: signal record write: record = ", record));
	    await elastic.index(record)
		.then((response) => {
		    log.trace(m("signal loop: OK: elastic.index(): wrote /beacon/signal record"));
		    log.trace(m("signal loop: elastic.index(): response =>"));
		    log.trace(response);
		    doBackoff = false;
		})
		.catch(error => {
		    log.debug(m("signal loop: ERROR: elastic.index(): catch(): could not write /beacon/signal record"));
		    log.debug(m("signal loop: ERROR: elastic.index(): catch(): unkown general error =>"));
		    log.debug(error);
		    log.debug(m("signal loop: elastic.index(): catch(): do backoff"));
		    doBackoff = true;
		})
	}
	await sleep(BEACON_SIG_PAUSE);
    }
})();

app.listen(common.LOCAL_SERVER_PORT, common.HOST);
log.debug(m(`log: beacon.js: main(): OK: ${gl.serviceName} server HTTP server on http://${common.HOST}:${common.LOCAL_SERVER_PORT}`));

*/
 
