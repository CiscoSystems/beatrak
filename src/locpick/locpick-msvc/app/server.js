"use strict";
  
const express = require("express");
const exec = require("child_process").exec;
const execSync = require("child_process").execSync;
const nocache = require("nocache");
const http = require("http");
const log = require("loglevel");

const utils = require("../common/utils.js"); 
 
var gl = {} // object that will keep all the vars "global" to this module
 
//latlon
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
  
//
// ENV
//
// keep LOG_LEVEL generic in the code

var LOG_LEVEL = process.env.LOG_LEVEL;
var CONFIG = process.env.CONFIG;
// first init output to console.log on purpose
// we should always print out the settings
// to be accessible from kubectl get logs
if(typeof LOG_LEVEL === 'undefined') {
    console.log("env: LOG_LEVEL is undefined, setting LOG_LEVEL to error");
    log.setLevel("error");
} else {
    log.setLevel(LOG_LEVEL);
    console.log("env: setting LOG_LEVEL = " + LOG_LEVEL);
}
if(typeof CONFIG === 'undefined') {
    console.log("env: CONFIG is undefined, setting CONFIG to list");
    CONFIG = "list"
} else {
    console.log("env: setting CONFIG = " + CONFIG);
}


// Constants
// Envoy admin url: "tcp://0.0.0.0:50011"
const HOST = "127.0.0.1";
const LOCPICK_PORT = 50001;
const LOCAL_SERVER_PORT = 8080;

// TODO: start dowing new calls!!!

// App
const app = express();
app.use(nocache());

//const sid = "locpick-hardcoded"; // service id

gl.sid = "locpick_" + Math.random().toString(36).substring(8);

//
// gl(module global) variables
//

var init = () => {
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
    
    log.debug("init(): gl.locmax = ", gl.locmax);
    log.debug("init(): gl.loclast = ", gl.loclast);
   
};
init();


app.get('/', function (outer_req, outer_res) {
    log.debug("(GET /): outer_req: " + outer_req.hostname + "(" + outer_req.ip + "):" + outer_req.originalUrl);

    var response = {};
    response.name = "locpick";
    response.sid = gl.sid;
    response.locpickid = gl.sid;
    response.type = gl.config.current.type;
    response.zone = gl.config.current.zone;

    outer_res.status(200); // may be others later
    utils.sendResponse(outer_res, outer_req, response);
});


// list of new colocations generated so far
app.get('/locs', function (outer_req, outer_res) {
    log.debug("(GET /locs): outer_req: " + outer_req.hostname + "(" + outer_req.ip + "):" + outer_req.originalUrl);
    log.debug("(GET /locs): gl.locMax = " + gl.locMax);

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


app.listen(LOCAL_SERVER_PORT, HOST);
console.log("main(): locpick server on http://" + HOST + ":" + LOCAL_SERVER_PORT);
