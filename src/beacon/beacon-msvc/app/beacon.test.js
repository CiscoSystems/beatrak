const axhttp = require("axios");
const log = require("loglevel");
const common = require("../common/common.js"); 
const utils = require("../common/utils.js");   
         
var gl = {};
//gl.HOST = "192.168.0.13"
//gl.PORT = common.STAGE1_PORT;
gl.HOST = common.HOST;
gl.PORT = common.LOCAL_SERVER_PORT;

const SERVICE_NAME = "beacon-devshell";

 
if(typeof process.env.SERVICE_NAME === 'undefined' || process.env.SERVICE_NAME == "") {
    console.log("env: SERVICE_NAME is undefined, setting gl.SERVICE_NAME to stage1");
    gl.SERVICE_NAME = "stage1";
} else {
    gl.SERVICE_NAME = process.env.SERVICE_NAME;
    console.log("env: gl.SERVICE_NAME = " + gl.SERVICE_NAME);
}

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
	log.error("ERROR: " + error);  
	log.trace("ERROR: ", error); 
	expect(error).toBeNull();
	done();
    });
});

 
