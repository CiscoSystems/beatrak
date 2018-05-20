/*
 *
 * OBUS
 *
 */

const getopt = require("node-getopt")
const grpc = require("grpc")
const fs = require("fs")
const utils = require("../common/utils.js")
const m = utils.m;
const log = require("loglevel");


//
// GLOBAL
//
var gl = {}
const PROTO_PATH = __dirname + "/../protos"
const KEY_PATH = __dirname   + "/../keys"
const obusProto = grpc.load(PROTO_PATH+"/obus.proto").obus
const locpickProto = grpc.load(PROTO_PATH+"/locpick.proto").locpick
const beaconProto = grpc.load(PROTO_PATH+"/beacon.proto").beacon


//
// FUNCTIONS
//
// TODO: import sleep() from common
const slp = (ms) => new Promise(resolve => {
    setTimeout(resolve,ms)
})


const locpickPing = (client, clientLabel) => {
    client.ping({ClientID: gl.sid, Label: clientLabel}, (error, response) => {
	if(error) {
	    console.log("log: obus.js: locpickPing(): ERROR: client.ping(): error = " + error)
	    return
	} else {
	    console.log("log: obus.js: locpickPing(): OK: client.ping(): received response = " + JSON.stringify(response))
	}
    })
}

const locpickInfo = (client, clientLabel) => {
    client.info({ClientID: gl.sid, Label: clientLabel}, (error, response) => {
	if(error) {
	    console.log("log: obus.js: locpickInfo(): ERROR:  client.info(): error = " + error)
	    return
	} else {
	    console.log("log: obus.js: locpickInfo(): OK: client.info(): received response = " + JSON.stringify(response))
	    return response
	}
    })
}


const beaconInfo = (client, clientLabel) => {
    client.info({ClientID: gl.sid, Label: clientLabel}, (error, response) => {
	if(error) {
	    console.log("log: obus.js: beaconInfo(): ERROR:  client.info(): error = " + error)
	    return
	} else {
	    console.log("log: obus.js: beaconInfo(): OK: client.info(): received response = " + JSON.stringify(response))
	    return response
	}
    })
}



const runPing = (client, clientLabel) => {
    client.ping({ClientID: gl.sid, Label: clientLabel}, (error, response) => {
	if(error) {
	    console.log("log: obus.js: runPing(): ping(): error = " + error)
	    return
	} else {
	    console.log("log: obus.js: runPing(): ping(): received response = " + JSON.stringify(response))
	}
    })
}

const runPingStreamFromServer = (client, clientLabel) => {
    var pingStreamFromServerCall = client.pingStreamFromServer({ClientID: gl.sid, Label: clientLabel})

    pingStreamFromServerCall.on('error', (response) => {
	console.log("log: obus.js: runPingStreamFromServer(): {error}: received response = " + JSON.stringify(response))
    })

    pingStreamFromServerCall.on('data', (response) => {
	console.log("log: obus.js: runPingStreamFromServer(): {data}: received response = " + JSON.stringify(response))
    })
    pingStreamFromServerCall.on('end', () => {
	console.log("log: obus.js: runPingStreamFromServer(): {end}: server done sending")
    })
}

const runPingStreamFromClient = (client, clientLabel) => {
    var labels = ["CS1", "CS2", "CS3"]
    var pingStreamFromClientCall = client.pingStreamFromClient((error, response) => {
	if (error) {
	    console.log("log: obus.js: runPingStreamFromClient(): create pingStreamFromClientCall, error = " + error)
	    return
	} else {
	    console.log("log: obus.js: runPingStreamFromClient(): created pingStreamFromClientCall")
	}
	console.log("log: obus.js: runPingStreamFromClient(): {call}: received response = " + JSON.stringify(response))
    })
    // send to requests to server
    labels.forEach(label => {
	pingStreamFromClientCall.write({ClientID: gl.sid, Label: `${clientLabel}-${label}`})
    })
    pingStreamFromClientCall.end()
}

const runPingStreamFromBoth = (client, clientLabel) => {
    // both client stream
    var pingStreamFromBothCall = client.pingStreamFromBoth((error, response) => {
	if (error) {
	    console.log("log: obus.js: runPingStreamFromBoth(): could not create the call object, error = " + error)
	    return
	} else {
	    console.log("log: obus.js: runPingStreamFromBoth(): created the call object")
	}
	console.log("log: obus.js: runPingStreamFromBoth(): {call}: received response = " + JSON.stringify(response))
    })

    pingStreamFromBothCall.on('error', (response) => {
	console.log("log: obus.js: runPingStreamFromBoth(): {error}: received response = " + JSON.stringify(response))
    })

    pingStreamFromBothCall.on('data', (response) => {
	console.log("log: obus.js: runPingStreamFromBoth(): {data}: received response = " + JSON.stringify(response))
    })
    pingStreamFromBothCall.on('end', () => {
	console.log("log: obus.js: runPingStreamFromBoth(): {end}: server done sending")
    })
    // send to requests to server
    labels = ["BSC1", "BSC2"]
    labels.forEach(label => {
	pingStreamFromBothCall.write({ClientID: gl.sid, Label: `${clientLabel}-${label}`})
    })
    pingStreamFromBothCall.end()
}


const initEnv = () => {
    // TLS

    // gl.tlsCaCert
    // gl.tlsClientKey
    
    if(typeof process.env.OBUS_TLS_CA_CERT === 'undefined' || process.env.OBUS_TLS_CA_CERT == "" ) {
	gl.tlsCaCert = KEY_PATH + "/ca-crt.pem"
	console.log("log: obus.js: initEnv(): OBUS_TLS_CA_CERT is undefined, gl.tlsCaCert = ", gl.tlsCaCert)
    } else {
	gl.tlsCaCert = process.env.OBUS_TLS_CA_CERT
	console.log("log: obus.js: initEnv(): gl.tlsCaCert = ", gl.tlsCaCert)
    }

    
    if(typeof process.env.OBUS_TLS_CLIENT_KEY === 'undefined' || process.env.OBUS_TLS_CLIENT_KEY == "" ) {
	gl.tlsClientKey = KEY_PATH + "/client1-key.pem"
	console.log("log: obus.js: initEnv(): OBUS_TLS_CLIENT_KEY is undefined, gl.tlsClientKey = ", gl.tlsClientKey)
    } else {
	gl.tlsClientKey = process.env.OBUS_TLS_CLIENT_KEY
	console.log("log: locpick.js: initEnv(): gl.tlsClientKey = ", gl.tlsClientKey)
    }

    if(typeof process.env.OBUS_TLS_CLIENT_CERT === 'undefined' || process.env.OBUS_TLS_CLIENT_CERT == "" ) {
	gl.tlsClientCert = KEY_PATH + "/client1-cert.pem"
	console.log("log: obus.js: initEnv(): OBUS_TLS_CLIENT_CERT is undefined, gl.tlsClientCert = ", gl.tlsClientCert)
    } else {
	gl.tlsClientCert = process.env.OBUS_TLS_CLIENT_CERT
	console.log("log: locpick.js: initEnv(): gl.tlsClientKey = ", gl.tlsClientKey)
    }

}


//
// INIT
//
const init = () => {
    initEnv()

    gl.opt = getopt.create([
	["", "server", "long server option"],
	["", "locpick", "long locpick option"],
	["", "beacon", "long beacon option"],
	["", "ping", "long ping option"],
	["", "info", "long info option"],
	["", "tls", "long tls option"],
	["h", "help", "display this help"],
    ])
    .bindHelp()
    .parseSystem()

    // we can pass:
    // ID
    // LABEL
    // HOST
    // PORT
    if(typeof process.env.ID === 'undefined' || process.env.ID == "") {
	gl.sid = "obus-" + Math.random().toString(36).substring(8)
	console.log("log: obus.js: init(): ID is undefined, setting gl.sid = " + gl.sid)
    } else {
	gl.sid = "obus-" + process.env.ID
	console.log("log: obus.js: init(): setting gl.sid = " + gl.sid)
    }

    if(typeof process.env.HOST === 'undefined' || process.env.HOST == "") {
	gl.host = "localhost"
	console.log("log: obus.js: init(): HOST is undefined, setting gl.host = " + gl.host)
    } else {
	gl.host = process.env.HOST
	console.log("log: obus.js: init(): setting gl.host = " + gl.host)
    }

    if(typeof process.env.PORT === 'undefined' || process.env.PORT == "") {
	// gl.port = "60001"
	gl.port = "55001"
	console.log("log: obus.js: init(): PORT is undefined, setting gl.port = " + gl.port)
    } else {
	gl.port = process.env.PORT
	console.log("log: obus.js: init(): setting gl.port = " + gl.port)
    }

    if(typeof process.env.LABEL === 'undefined' || process.env.LABEL == "") {
	gl.label = "obus-default-label"
	console.log("log: obus.js: init(): LABEL is undefined, setting gl.label = " + gl.label)
    } else {
	gl.label = process.env.LABEL
	console.log("log: obus.js: init(): setting gl.label = " + gl.label)
    }

    gl.endpoint = gl.host + ":" + gl.port
}

// need to be async() here for the
// sleep and other sync stuff to work
const talkServer = ( async () => {
    console.log("log: obus.js: talkServer(): connecting gl.endpoint = " + gl.endpoint)
    client = new obusProto.Pinger(gl.endpoint,
    				  grpc.credentials.createInsecure())
    while(true) {
	runPing(client, gl.label)
//	runPingStreamFromServer(client, gl.label)
//	runPingStreamFromClient(client, gl.label)
//	runPingStreamFromBoth(client, gl.label)
	console.log("log: obus.js: main(): sleep 5s")
	await slp(2000)
	    .catch( error => {"log: log: obus.js: main(): slp(), error = " + error})
	console.log("log: obus.js: main(): done sleeping ---------------------------------------------")
    }
})

const talkLocpick = ( async (meth) => {
    console.log("log: obus.js: talkLocpick(): meth = ", meth)
    var client = {}
    if(gl.opt.options.tls) {
	//
	// TLS
	//
	console.log("log: obus.js: talkLocpick(): TLS on")

	// ChannelCredentials
/*
	const channelCredsTls = grpc.credentials.createSsl(
	    fs.readFileSync(KEY_PATH + "/ca-crt.pem"),
	    fs.readFileSync(KEY_PATH + "/client1-key.pem"),
	    fs.readFileSync(KEY_PATH + "/client1-crt.pem"), // CN=TBD
	)
*/

	const channelCredsTls = grpc.credentials.createSsl(
	    fs.readFileSync(gl.tlsCaCert),
	    fs.readFileSync(gl.tlsClientKey),
	    fs.readFileSync(gl.tlsClientCert), // CN=TBD
	)

	console.log("log: obus.js: talkLocpick(): channelCredsTls = ", channelCredsTls)
	console.log("log: obus.js: talkLocpick(): typeof(channelCredsTls) = " + typeof(channelChredsTls))
	
	client = new locpickProto.Locpick("localhost:58090", channelCredsTls)
	console.log("log: obus.js: talkLocpick(): client = ", client)
	
    } else {
	client = new locpickProto.Locpick(gl.endpoint,
    					  grpc.credentials.createInsecure())
    }

    if(meth == "ping") {
	while(true) {
	    console.log("log: obus.js: talkLocpick(): {ping}: connecting gl.endpoint = " + gl.endpoint)
	    locpickPing(client, gl.label)
	    console.log("log: obus.js: main(): sleep 5s")
	    await slp(2000)
		.catch( error => {"log: log: obus.js: main(): slp(), error = " + error})
	    console.log("log: obus.js: main(): done sleeping ---------------------------------------------")
	}
    } else if(meth == "info") {
	console.log("log: obus.js: talkLocpick(): {info}: connecting gl.endpoint = " + gl.endpoint)
	// TODO: make locpickInfo sync, right now info is undefined
	var info = locpickInfo(client, gl.label)
	console.log("log: obus.js: talkLocpick(): {info}: info = " + info)
    } else {
	console.log("log: obus.js: talkLocpick(): don't know meth = ", meth)
    }
})


const talkBeacon = ( async (meth) => {
    console.log("log: obus.js: talkBeacon(): meth = ", meth)
    client = new beaconProto.Beacon(gl.endpoint,
    				      grpc.credentials.createInsecure())
    if(meth == "ping") {
	while(true) {
	    console.log("log: obus.js: talkBeacon(): {ping}: connecting gl.endpoint = " + gl.endpoint)
	    locpickPing(client, gl.label)
	    console.log("log: obus.js: talkBeacon(): sleep 5s")
	    await slp(2000)
		.catch( error => {"log: obus.js: talkBeacon(): slp(), error = " + error})
	    console.log("log: obus.js: talkBeacon(): done sleeping ---------------------------------------------")
	}
    } else if(meth == "info") {
	console.log("log: obus.js: talkBeacon(): {info}: connecting gl.endpoint = " + gl.endpoint)
	// TODO: make beaconInfo sync, right now info is undefined
	var info = beaconInfo(client, gl.label)
	console.log("log: obus.js: talkBeacon(): {info}: info = " + info)
    } else {
	console.log("log: obus.js: talkBeacon(): don't know meth = ", meth)
    }
})





//
// MAIN
//
const main = ( async () => {
    init()

    if (gl.opt.options.server) {
	talkServer()
    } else if(gl.opt.options.locpick) {
	if(gl.opt.options.ping) {
	    talkLocpick("ping")
	} else if(gl.opt.options.info) {
	    talkLocpick("info")
	} else {
	    talkLocpick("ping")
	}
    } else if(gl.opt.options.beacon) {
	if(gl.opt.options.ping) {
	    talkBeacon("ping")
	} else if(gl.opt.options.info) {
	    talkBeacon("info")
	} else {
	    talkBeacon("ping")
	}
    } else {
	talkServer()
    }
})

main()
