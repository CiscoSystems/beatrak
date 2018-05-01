//'use strict';

const express = require('express');
// needed for express
// https://www.npmjs.com/package/body-parser
const bodyparser = require('body-parser');
const nocache = require('nocache');
const exec = require('child_process').exec;
const execSync = require('child_process').execSync;
const http = require('http');
const elasticsearch = require('elasticsearch');
const moment = require('moment');
const log = require('loglevel');
const axhttp = require("axios");
const {promisify} = require("util");
const utils = require("../common/utils.js");
const {sleep} = require("../common/utils.js");
const common = require("../common/common.js");
const { Client } = require("pg");

console.log("utils.LOADED = " + utils.LOADED);  
 
//
// ENV
//
var SERVICE_NAME;
var CLUSTER;
var ZONE;
var LOG_LEVEL;

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

if(typeof process.env.SERVICE_NAME === 'undefined' || process.env.SERVICE_NAME == "") {
    console.log("env: SERVICE_NAME is undefined, setting SERVICE_NAME to stage1");
    SERVICE_NAME = "stage1";
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

if(typeof process.env.CLUSTER === 'undefined' || process.env.CLUSTER == "") {
    console.log("env: CLUSTER is undefined, setting CLUSTER to \"nocluster\"");
    CLUSTER = "nocluster"
} else {
    CLUSTER = process.env.CLUSTER;
    console.log("env: CLUSTER = " + CLUSTER);
}
  
// 
// CONST
//
// elastic does not like - so for beacon that writes to elastic replace it
const sid = SERVICE_NAME.replace(/-/gi,"-") + "-" + Math.random().toString(36).substring(8) + "-" + CLUSTER + "-" + ZONE; 
 

//log.setLevel("trace");

//
// GLOBAL
//
var gl = {}
gl.signal = {};
// postgresql client

// App 
const app = express();
app.use(nocache());
app.use(bodyparser.json());
const m = utils.m;

const init = (async () => {
	try {
	    gl.pg = new Client({
		user: 'postgres',
//		host: '10.99.149.235',
//		host: 'localhost',
//		host: 'postgresql-svc.default.svc.cluster.local',
		host: '127.0.0.1', 
		port: 50005
 	    });

	    await gl.pg.connect();
	    log.debug(m("init(): after gl.pg.connect()"));

//	    let query = "SELECT NOW()";
//	    let query = "SELECT * FROM stage1_init;";

	    gl.signal.stage1_id = sid;
	    gl.signal.stage1_cluster = CLUSTER;
	    gl.signal.stage1_zone = ZONE;

	    let sql = "INSERT INTO stage1_init (stage1_id, stage1_cluster, stage1_zone, stage1_timestamp) \
                               VALUES ($1, $2, $3, $4)";
	    let values = [gl.signal.stage1_id, gl.signal.stage1_cluster, gl.signal.stage1_zone, moment().format('YYYY-MM-DDTHH:mm:ssZ')];

	    await gl.pg.query(sql, values)
		.then(response => {
		    log.trace(m("init(): response => "));
		    log.trace(response);
		    if(response.rowCount != 1) {
			throw Error("[init]: could not write to stage_init, rowCount != 1");
		    } else {
			log.debug(m("init(): OK: wrote init record"));
		    }
			
		    log.trace(m("init(): response.fields => "));
		    log.trace(response.fields);
		    response.fields.map(field => {
			log.trace(m("init(): field =>"));
			log.trace(field);
			log.trace(m("init(): field.name => " + field.name));
		    });
		    log.trace(m("init(): response.rows =>"));
		    log.trace(response.rows);
		    response.rows.forEach(row => {
			log.trace(m("init(): row =>"));
			log.trace(row);
			log.trace(m("init(): row.now => " + row.now));
		    });
		})
		.catch(queryerror => {
		    log.error(m("init(): ERROR: could not verify postgresql connection, queryerror => "));
		    log.error(queryerror);
		    return;
		});
	} catch (tryerror) {
	    log.error(m("init(): ERROR: could not connect or verify postgresql connection, tryerror => "));
	    log.error(tryerror);
	    return;
	}
});

//
// MAIN
//
(async () => {

    await init();
    log.debug(m("main(): after init()"));

    app.listen(common.LOCAL_SERVER_PORT, common.HOST);
    log.debug(m(`main(): SERVER: ${SERVICE_NAME} server on http://${common.HOST}:${common.LOCAL_SERVER_PORT}`));

})();

//
// REST
//
app.get("/", function (outer_req, outer_res) {
    log.debug(m("(GET /): " + outer_req.hostname + "(" + outer_req.ip + "):" + outer_req.originalUrl));

    var response = {};
    response.name = SERVICE_NAME
    response.sid = sid;
    response.stage1id = sid;
    response.cluster = CLUSTER;
    response.zone = ZONE;

    outer_res.status(200); // may be others later
    utils.sendResponse(outer_res, outer_req, response);
 
});


app.put('/:beaconZONE/signal/', async (outer_req, outer_res) => {
    log.trace(m("(PUT /:beaconZONE/signal/): " + outer_req.hostname + "(" + outer_req.ip + "):" + outer_req.originalUrl));
    log.trace(m("(PUT /:beaconZONE/signal/): outer_req.body =>"));
    log.trace(outer_req.body); 

    let signal = {};

    var response = {};
    response.name = SERVICE_NAME
    response.sid = sid;
    response.stage1id = sid;

    let beaconZONE = outer_req.params.beaconZONE;

    if(typeof outer_req.body === 'undefined'
       || typeof outer_req.body.locpickid === 'undefined'
       || typeof outer_req.body.beaconid === 'undefined'
       || typeof outer_req.body.beaconzone === 'undefined'
       || typeof outer_req.body.beacon_timestamp === 'undefined'
       || typeof outer_req.body.loc === 'undefined') {
	log.error(m("(/:beaconZONE/signal/): ERROR: could not read PUT body, continue..."))
	log.error(m("(/:beaconZONE/signal/): ERROR: body = " + outer_req.body))
	log.error(m("(/:beaconZONE/signal/): ERROR: body.locpickid        = " + outer_req.body.locpickid))
	log.error(m("(/:beaconZONE/signal/): ERROR: body.beaconid         = " + outer_req.body.beaconid))
	log.error(m("(/:beaconZONE/signal/): ERROR: body.beaconzone       = " + outer_req.body.beaconzone))
	log.error(m("(/:beaconZONE/signal/): ERROR: body.beacon_timestamp = " + outer_req.body.beacon_timestamp))
	log.error(m("(/:beaconZONE/signal/): ERROR: body.loc              = " + outer_req.body.loc))
	
	response.signal = signal;
	response.error = { "error" : "(/:beaconZONE/signal/): could not read PUT body" };
	outer_res.status(400);
	utils.sendResponse(outer_res, outer_req, response);
	return;
    } else {
	signal.stage1_id = sid;
	signal.stage1_cluster = CLUSTER;
	signal.stage1_zone = ZONE;
	signal.locpick_id = outer_req.body.locpickid;
	signal.beacon_id = outer_req.body.beaconid;
	signal.beacon_ts = outer_req.body.beaconts;
	signal.loc = outer_req.body.loc;

	if(beaconZONE != outer_req.body.beaconzone) {
	    log.error(m(`(PUT /:beaconZONE/signal/): ERROR: beaconZONE = ${beaconZONE} is not the same as within the PUT body beaconzone = ${outer_req.body.beaconzone}`))
	    response.signal = signal;
	    response.error = { "error" : `(PUT /:beaconZONE/signal/): ERROR: beaconZONE = ${beaconZONE} is not the same as within the PUT body beaconzone = ${outer_req.body.beaconzone}`};
	    outer_res.status(400);
	    utils.sendResponse(outer_res, outer_req, response);
	    return;
	} else {
	    signal.beacon_zone = beaconZONE;
	}

    }

    let sql = "INSERT INTO stage1_signal ( \
                      stage1_id, \
	              stage1_cluster, \
	              stage1_zone, \
                      stage1_timestamp, \
                      locpick_id, \
                      beacon_id, \
                      beacon_zone, \
                      beacon_ts, \
                      loc_name, \
                      loc_lonlat, \
                      loc_zone, \
                      rest_call \
                      ) VALUES ( \
                      $1, \
                      $2, \
                      $3, \
                      $4, \
                      $5, \
                      $6, \
                      $7, \
                      $8, \
                      $9, \
                      $10, \
                      $11, \
                      $12 \
                      )";

    log.trace(m("(/:beaconZONE/signal/): signal =>"));
    log.trace(signal);

    let values = [
	signal.stage1_id,
	signal.stage1_cluster,
	signal.stage1_zone,
	moment().format('YYYY-MM-DDTHH:mm:ssZ'),
	signal.locpick_id,
	signal.beacon_id,
	signal.beacon_zone,
	signal.beacon_ts,
	signal.loc.name,
	signal.loc.lonlat,
	signal.loc.zone,
	`${outer_req.hostname}(${outer_req.ip}): PUT ${outer_req.originalUrl}`
    ];

    let pgWriteSuccess = false;
    try {
	const response = await gl.pg.query(sql, values);
	log.trace(m("response => "));
	log.trace(response);
	if(response.rowCount != 1) throw Error("rowCount is not 1");
	response.rows.forEach(row => {
	    log.trace(m("init(): row =>"));
	    log.trace(row);
	});
	pgWriteSuccess = true;
    } catch(tryerror) {
	log.error(m("(PUT /:beaconZONE/signal/): could not connect or verify connection, tryerror => "));
	log.error(tryerror);
	pgWriteSuccess = false;
    }
 
    if(pgWriteSuccess) {
	log.trace(m("(PUT /:beaconZONE/signal/): OK: wrote record"));
	outer_res.status(200); // may be others later
    } else {
	log.error(m("(PUT /:beaconZONE/signal/): ERROR: could not write record"));
	outer_res.status(500); // the query was fine, but it's an "internal error"
	                       // error because we could not write record
	response.error = { "error" : "(PUT /signal): could not write record" };
    }

    utils.sendResponse(outer_res, outer_req, response); 
}


);
