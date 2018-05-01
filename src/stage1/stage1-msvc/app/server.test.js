const axhttp = require("axios");
const log = require("loglevel");
const moment = require("moment");
const common = require("../common/common.js"); 
const utils = require("../common/utils.js");   

var gl = {};
gl.HOST = "localhost";
gl.PORT = 8080;

//gl.HOST = "192.168.0.13"
//gl.PORT = common.STAGE1_PORT;
 
if(typeof process.env.SERVICE_NAME === 'undefined' || process.env.SERVICE_NAME == "") {
    console.log("env: SERVICE_NAME is undefined, setting gl.SERVICE_NAME to stage1");
    gl.SERVICE_NAME = "stage1";
} else {
    gl.SERVICE_NAME = process.env.SERVICE_NAME;
    console.log("env: gl.SERVICE_NAME = " + gl.SERVICE_NAME);
}


//gl.HOST = "localhost";
//gl.PORT = 8080;

gl.BASE_URL = `http://${gl.HOST}:${gl.PORT}`;
// trace, debug, error
log.setLevel("debug");

//
// TEST
//
beforeAll(done => {
    (async () => { 
	log.debug("beforeAll(): waiting for 0.5 sec for service to startup");
	await utils.sleep(500); 
	done();
    })();  
});
   
//  
// TEST
// 
testPing = test("ping stage1-devshell service", done => {
    log.debug("testPing(): pinging url = ", gl.BASE_URL);
    axhttp.get(gl.BASE_URL).then(response => {
	log.debug("testPing(): data = ", response.data);
	log.debug("testPing(): status = ", response.status)
	log.debug("testPing(): statusText = ", response.statusText);
	log.trace("testPing(): headers = ", response.headers);
	log.trace("testPing(): config = ", response.config);
	expect(response.status).toBe(200);
	expect(response.data.name).toBe(gl.SERVICE_NAME);   
	done();
    }).catch(error => {   
	log.error("testPing(): in the catch pinging url = ", gl.BASE_URL);
	log.error("testPing(): ERROR: ------------- server.test.js ----------------\ntestPing(): ERROR: - there is no autodiscovery yet\ntestPing(): ERROR: - enter HOST and PORT in file, plz :)\ntestPing(): ERROR: ----------------------------------------------");
	log.debug("ERROR: " + error);  
	log.trace("ERROR: ", error); 
	expect(error).toBeNull();
	done();
    });
});


testPutSignalZoneError = test("error receive (on PUT) signal, check non-equal zone", done => {
    let url = gl.BASE_URL + "/testzone/signal/?pretty"
    log.debug("testPutSignal(): PUT url = " + url);

    let signal = {};
    signal.locpickid = "locpickidtest";
    signal.beaconid = "beaconidtest";
    signal.beaconzone = "beaconzonetest";
    signal.loc = {"name" : "brusselstest", "lonlat" : "50.8386789,4.2931938", "zone" : "loczonetest"},

    axhttp.put(url, signal).then(response => { 
	log.debug("testPutSignal(): data = ", response.data);
	log.debug("testPutSignal(): status = ", response.status)
	log.debug("testPutSignal(): statusText = ", response.statusText);
	log.trace("testPutSignal(): headers = ", response.headers); 
	log.trace("testPutSignal(): config = ", response.config);
	expect(response.status).toBe(200);
	expect(response.data.name).toBe(gl.SERVICE_NAME);   
	done.fail();
    }).catch(error => {   
	log.debug("testPutSignal(): in the catch pinging url = ", gl.BASE_URL);
	log.debug("ERROR: error = " + error);
	log.debug("ERROR: error detail = ", error.response.data.error.error);  
	log.debug("ERROR: error data = ", error.response.data);  
	log.trace("ERROR: ", error); 
	expect(error).not.toBeNull();
	expect(error.toString()).toMatch(/400/); 
	// Error: Request failed with status code 400
	done();
    });
});
  
testPutSignal = test("receive (on PUT) signal", done => {
    let url = gl.BASE_URL + "/beaconzonetest/signal/?pretty"
    log.debug("testPutSignal(): PUT url = " + url); 

    let signal = {};
    signal.locpickid = "locpickidtest";
    signal.beaconid = "beaconidtest";
    signal.beaconzone = "beaconzonetest";
    signal.beaconts = moment().format('YYYY-MM-DDTHH:mm:ssZ');
    signal.loc = {"name" : "brusselstest", "lonlat" : "50.8386789,4.2931938", "zone" : "loczonetest"},
 
    axhttp.put(url, signal).then(response => { 
	log.debug("testPutSignal(): data = ", response.data);
	log.debug("testPutSignal(): status = ", response.status)
	log.debug("testPutSignal(): statusText = ", response.statusText);
	log.trace("testPutSignal(): headers = ", response.headers); 
	log.trace("testPutSignal(): config = ", response.config);
	expect(response.status).toBe(200);
	expect(response.data.name).toBe(gl.SERVICE_NAME);   
	done();
    }).catch(error => {   
	log.error("testPutSignal(): in the catch pinging url = ", gl.BASE_URL);
	log.debug("ERROR: error = " + error);
	log.debug("ERROR: error detail = ", error.response.data.error.error);  
	log.debug("ERROR: error data = ", error.response.data);  
	log.trace("ERROR: ", error); 
	expect(error).toBeNull();
	done();
    });
});
