//'use strict';
 
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
const {sleep,expBackoff} = require("../common/utils.js");
const common = require("../common/common.js");

console.log("utils.LOADED = " + utils.LOADED);  
 
//
// ENV
//
var ZONE;
var SERVICE_NAME;
var LOG_LEVEL;
var BEACON_SIG_NUMBER;
var BEACON_SIG_PS;

//
// first init output to console.log on purpose
// we should always print out the settings
// to be accessible from kubectl get logs
if(typeof process.env.LOG_LEVEL === 'undefined' || process.env.LOG_LEVEL == "" ) {
   console.log("env: LOG_LEVEL is undefined, setting LOG_LEVEL to error");
    log.setLevel("error");
} else {
    LOG_LEVEL = process.env.LOG_LEVEL;
    log.setLevel(LOG_LEVEL);
    console.log("env: LOG_LEVEL = " + LOG_LEVEL);
}

if(typeof process.env.BEACON_SIG_NUMBER === 'undefined' || process.env.BEACON_SIG_NUMBER == "") {
    console.log("env: BEACON_SIG_NUMBER is undefined, setting BEACON_SIG_NUMBER to -1 (infinit)");
    BEACON_SIG_NUMBER = -1;
} else {
    BEACON_SIG_NUMBER = process.env.BEACON_SIG_NUMBER;
    console.log("env: BEACON_SIG_NUMBER = " + BEACON_SIG_NUMBER);
}
 
if(typeof process.env.BEACON_SIG_PS === 'undefined' || process.env.BEACON_SIG_PS == "") {
    console.log("env: BEACON_SIG_PS is undefined, setting BEACON_SIG_PS to 1 (1 per second)");
    BEACON_SIG_PS = 1;
} else {
    BEACON_SIG_PS = process.env.BEACON_SIG_PS;
    console.log("env: BEACON_SIG_PS = " + BEACON_SIG_PS);
}

if(typeof process.env.SERVICE_NAME === 'undefined' || process.env.SERVICE_NAME == "") {
    console.log("env: SERVICE_NAME is undefined, setting SERVICE_NAME to beacon");
    SERVICE_NAME = "beacon";
} else {
    SERVICE_NAME = process.env.SERVICE_NAME;
    console.log("env: SERVICE_NAME = " + SERVICE_NAME);
}

if(typeof process.env.ZONE === 'undefined' || process.env.ZONE == "") {
    console.log("env: ZONE is undefined, setting ZONE to \"nozone\"");
    ZONE = "nozone"
} else {
    ZONE = process.env.ZONE;
    console.log("env: ZONE = " + ZONE);
}
//
// CONST
//
// elastic does not like - so for beacon that writes to elastic replace it
const sid = SERVICE_NAME.replace(/-/gi,"_") + "_" + Math.random().toString(36).substring(8) + "_" + ZONE 


//
// GLOBAL
//
var gl = {}
gl.signal = {};
gl.stage1BaseURL = `http://${common.HOST}:${common.STAGE1_PORT}`
//gl.stage1BaseURL = `http://${common.HOST}:${common.STAGE1_DEVSHELL_PORT}`
gl.isElasticReachable = false;
gl.doWriteStage1 = false;
// we're doing load balancing
// so we don't want to wait for too long,
// but wait anywhay incase we have
// a single one with a load
gl.stage1BackoffNumber = 5; // how many cycles/signals to wait until try to reconnect again

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

const m = utils.m;

// we need init() to be async() so that we can do await inside
const init = (async () => {
    log.debug(m("init(): starting..."));
    log.debug(m(`init(): sid = ${sid}`));
 //    BEACON_SIG_PAUSE = 1000 * BEACON_SIG_PS;
    BEACON_SIG_PAUSE = 1000 / BEACON_SIG_PS;
    log.debug(m("init(): setting BEACON_SIG_PAUSE = ", BEACON_SIG_PAUSE));

    var locpickURL = `http://${common.HOST}:${common.LOCPICK_PORT}/${ZONE}/locs?pretty`
    log.debug(moment().format('YYYY-MM-DDTHH:mm:ssZ') + " init(): locpickURL = ", locpickURL);

    let url = locpickURL;
    await axhttp.put(url).then(response => {
	log.debug(m("init(): locpick response.data =>\n"))
	log.debug(JSON.stringify(response.data, null, "\t"));
	log.debug(m("init(): locpick response.status = ", response.status))
	log.debug(m("init(): locpick response.statusText = ", response.statusText));
	
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

//NEXT: continue with this pining business


//
// REST
//
app.get("/", (outer_req, outer_res) => {
    log.debug("outer_req: " + outer_req.hostname + "(" + outer_req.ip + "):" + outer_req.originalUrl);

    var response = {};
    response.name = SERVICE_NAME; 
    response.sid = sid;
    response.beaconid = sid;
    response.signal = gl.signal;


    if(typeof outer_req.query.pretty !== 'undefined') {
	outer_res.send(JSON.stringify(response, null, "\t"));
    } else {
	outer_res.send(JSON.stringify(response));
    }

});




//
// MAIN LOOP
//
(async () => {
    let signalCount = -1;
    let isElasticReady = false;
    let doBackoff = false;
    let record;
    let stage1BackoffCount = 0;

    await init();

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
log.debug(m(`main(): SERVER: ${SERVICE_NAME} server on http://${common.HOST}:${common.LOCAL_SERVER_PORT}`));


 
