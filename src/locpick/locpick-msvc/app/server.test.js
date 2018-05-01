const axhttp = require("axios");
const log = require("loglevel");

var gl = {};
gl.HOST = process.env.HOSTNAME;
gl.PORT = 50001
gl.BASE_URL = `http://${gl.HOST}:${gl.PORT}`;
// trace, debug, error
log.setLevel("error");

//
// TEST
//
beforeAll(() => {
});
 
//
// TEST
//
testPing = test("ping service ", done => {
    log.debug("testPing(): pinging url = ", gl.BASE_URL);
    axhttp.get(gl.BASE_URL).then(response => {
	log.debug("testPing(): data = ", response.data);
	log.debug("testPing(): status = ", response.status)
	log.debug("testPing(): statusText = ", response.statusText);
	log.trace("testPing(): headers = ", response.headers);
	log.trace("testPing(): config = ", response.config);
	expect(response.status).toBe(200);
	expect(response.data.name).toBe("locpick");
	expect(response.data.type).toEqual(expect.anything());
	expect(response.data.zone).toEqual(expect.anything());
	done();
    }).catch(error => {
	log.error("testPing(): pinging url = ", gl.BASE_URL);
	log.error("testPing(): ERROR: ------------- server.test.js ----------------\ntestPing(): ERROR: - there is no autodiscovery yet\ntestPing(): ERROR: - enter HOST and PORT in file, plz :)\ntestPing(): ERROR: ----------------------------------------------");
	// log.debug("ERROR: ", error);
	expect(error).toBeNull();
	done();
    });
});

//
// TEST - skipping this one, need a zone, but leaving it for history,
//        might need a zoneless location in the future
testNewLoc = test.skip("generate new location", done => {
    let url = gl.BASE_URL + "/locs?pretty"
    axhttp.put(url).then(response => {
	log.debug("testNewLoc(): data =>\n", JSON.stringify(response.data, null, "\t"));
	log.debug("testNewLoc(): status = ", response.status)
	log.debug("testNewLoc(): statusText = ", response.statusText);
	expect(response.status).toBe(200);
	expect(response.data).toEqual(expect.anything());
	expect(response.data.loc).toEqual(expect.anything());
	expect(response.data.loc.name).toEqual(expect.anything());
	expect(response.data.loc.lonlat).toEqual(expect.anything());
	done();
    }).catch(error => {
	log.error("testNewLoc(): PUT url = ", url);
	expect(error).toBeNull();
	done();
    });
});

//
// TEST
//
testNewLoc = test("get location has a count and locs", done => {
    let url = gl.BASE_URL + "/locs?pretty"
    axhttp.get(url).then(response => {
	log.debug("testNewLoc(): data =>\n", JSON.stringify(response.data, null, "\t"));
	log.debug("testNewLoc(): status = ", response.status)
	log.debug("testNewLoc(): statusText = ", response.statusText);
	expect(response.status).toBe(200);
	expect(response.data).toEqual(expect.anything());
	expect(response.data.count).toEqual(expect.anything());
	expect(response.data.locs).toEqual(expect.anything());
	done();
    }).catch(error => {
	log.error("testNewLoc(): PUT url = ", url);
	expect(error).toBeNull();
	done();
    });
});

//
// TEST
//
testGetConfig = test("get config", done => {
    let url = gl.BASE_URL + "/config?pretty"
    axhttp.get(url).then(response => {
	log.debug("testGetConfig(): data =>\n", JSON.stringify(response.data, null, "\t"));
	log.debug("testGetConfig(): status = ", response.status)
	log.debug("testGetConfig(): statusText = ", response.statusText);
	expect(response.status).toBe(200);
	expect(response.data).toEqual(expect.anything());
	expect(response.data.config).toEqual(expect.anything());
	expect(response.data.config.current).toEqual(expect.anything());
	done();
    }).catch(error => {
	log.error("testGetConfig(): GET url = ", url);
	expect(error).toBeNull();
	done();
    });
});


//
// TEST
//
testResetSameZone = test("reset same zone", done => {
    let url = gl.BASE_URL + "/config?pretty";
    let config = {};

    // need to write everything is async so that we  an do http calls syncrously
    (async () => {
	//
	// get original config
	//
	await (() => {
	    return new Promise((resolve, reject) => { axhttp.get(url).then(response => {
		log.debug("testResetSameZone(): data =>\n", JSON.stringify(response.data, null, "\t"));
		log.debug("testResetSameZone(): status = ", response.status)
		log.debug("testResetSameZone(): statusText = ", response.statusText);
		expect(response.status).toBe(200);
		expect(response.data).toEqual(expect.anything());
		expect(response.data.config).toEqual(expect.anything());
		expect(response.data.config.current).toEqual(expect.anything());
		config = response.data.config;
		resolve(); // we do done() up the stack acter wait
	    }).catch(error => {
		log.error("testResetSameZone(): GET url = ", url);
		throw error; // no reject, just through error to be reported in jest properly
	    });
          }); // end promise
	})(); // await

	log.debug("testResetSameZone(): this should be last, after we have config");
	log.debug("testResetSameZone(): config.current.type = ", config.current.type);
	log.debug("testResetSameZone(): config.current.zone = ", config.current.zone);

	let lastZone = config.current.zone;

	//
	// reset
	// 
	url = gl.BASE_URL + "/reset?pretty";
	await (() => {
	    return new Promise((resolve, reject) => { axhttp.get(url).then(response => {
		log.debug("testResetSameZone(): data =>\n", JSON.stringify(response.data, null, "\t"));
		log.debug("testResetSameZone(): status = ", response.status)
		log.debug("testResetSameZone(): statusText = ", response.statusText);
		expect(response.status).toBe(200);
		expect(response.data.sid).toEqual(expect.anything());
		resolve(); // we do done() up the stack acter wait
	    }).catch(error => {
		log.error("testResetSameZone(): GET url = ", url);
		throw error; // no reject, just through error to be reported in jest properly
	    });
          }); // end promise
	})(); // await

	//
	// get new config
	//
	url = gl.BASE_URL + "/config?pretty";
	await (() => {
	    return new Promise((resolve, reject) => { axhttp.get(url).then(response => {
		log.debug("testResetSameZone(): data =>\n", JSON.stringify(response.data, null, "\t"));
		log.debug("testResetSameZone(): status = ", response.status)
		log.debug("testResetSameZone(): statusText = ", response.statusText);
		expect(response.status).toBe(200);
		expect(response.data).toEqual(expect.anything());
		expect(response.data.config).toEqual(expect.anything());
		expect(response.data.config.current).toEqual(expect.anything());
		config = response.data.config;
		resolve(); // we do done() up the stack acter wait
	    }).catch(error => {
		log.error("testResetSameZone(): GET url = ", url);
		throw error; // no reject, just through error to be reported in jest properly
	    });
          }); // end promise
	})(); // await

	expect(config.current.zone).toEqual(lastZone);
	
	done();
    })(); // async
});

//
// TEST
//
testResetDifferentZone = test("reset and different zone", done => {
    let url = gl.BASE_URL + "/config?pretty";
    let config = {};

    // need to write everything is async so that we  an do http calls syncrously
    (async () => {
	//
	// get original config
	//
	await (() => {
	    return new Promise((resolve, reject) => { axhttp.get(url).then(response => {
		log.debug("testResetSameZone(): data =>\n", JSON.stringify(response.data, null, "\t"));
		log.debug("testResetSameZone(): status = ", response.status)
		log.debug("testResetSameZone(): statusText = ", response.statusText);
		expect(response.status).toBe(200);
		expect(response.data).toEqual(expect.anything());
		expect(response.data.config).toEqual(expect.anything());
		expect(response.data.config.current).toEqual(expect.anything());
		config = response.data.config;
		resolve(); // we do done() up the stack acter wait
	    }).catch(error => {
		log.error("testResetSameZone(): GET url = ", url);
		throw error; // no reject, just through error to be reported in jest properly
	    });
          }); // end promise
	})(); // await

	log.debug("testResetSameZone(): this should be last, after we have config");
	log.debug("testResetSameZone(): config.current.type = ", config.current.type);
	log.debug("testResetSameZone(): config.current.zone = ", config.current.zone);

	let lastZone = config.current.zone;
	let newZone;

	//
	// reset
	// 
	if(lastZone == "za") {
	    url = gl.BASE_URL + "/reset?pretty&zone=zb";
	    newZone = "zb";
	} else {
	    lastZone = "zb"
	    newZone = "za";
	    url = gl.BASE_URL + "/reset?pretty&zone=za";
	}

	await (() => {
	    return new Promise((resolve, reject) => { axhttp.get(url).then(response => {
		log.debug("testResetSameZone(): data =>\n", JSON.stringify(response.data, null, "\t"));
		log.debug("testResetSameZone(): status = ", response.status)
		log.debug("testResetSameZone(): statusText = ", response.statusText);
		expect(response.status).toBe(200);
		expect(response.data.sid).toEqual(expect.anything());
		resolve(); // we do done() up the stack acter wait
	    }).catch(error => {
		log.error("testResetSameZone(): GET url = ", url);
		throw error; // no reject, just through error to be reported in jest properly
	    });
          }); // end promise
	})(); // await

	//
	// get new config
	//
	url = gl.BASE_URL + "/config?pretty";
	await (() => {
	    return new Promise((resolve, reject) => { axhttp.get(url).then(response => {
		log.debug("testResetSameZone(): data =>\n", JSON.stringify(response.data, null, "\t"));
		log.debug("testResetSameZone(): status = ", response.status)
		log.debug("testResetSameZone(): statusText = ", response.statusText);
		expect(response.status).toBe(200);
		expect(response.data).toEqual(expect.anything());
		expect(response.data.config).toEqual(expect.anything());
		expect(response.data.config.current).toEqual(expect.anything());
		config = response.data.config;
		resolve(); // we do done() up the stack acter wait
	    }).catch(error => {
		log.error("testResetSameZone(): GET url = ", url);
		throw error; // no reject, just through error to be reported in jest properly
	    });
          }); // end promise
	})(); // await

	expect(config.current.zone).not.toEqual(lastZone);
	expect(config.current.zone).toEqual(newZone);
  	
	done();
    })(); // async
});


testNewLocWithZone = test("generate new location with zone", done => {
    let zone = "za";
    let url = gl.BASE_URL + `/${zone}/locs?pretty`
    axhttp.put(url).then(response => {
	log.debug("testNewLoc(): data =>\n", JSON.stringify(response.data, null, "\t"));
	log.debug("testNewLoc(): status = ", response.status)
	log.debug("testNewLoc(): statusText = ", response.statusText);
	expect(response.status).toBe(200);
	expect(response.data).toEqual(expect.anything());
	expect(response.data.loc).toEqual(expect.anything());
	expect(response.data.loc.name).toEqual(expect.anything());
	expect(response.data.loc.lonlat).toEqual(expect.anything());
	done();
    }).catch(error => {
	log.error("testNewLoc(): PUT url = ", url);
	expect(error).toBeNull();
	done();
    });
});


testNewLocWithBadZone = test("generate new location with bad zone zone", done => {
    let zone = "zzz";
    let url = gl.BASE_URL + `/${zone}/locs?pretty`
    axhttp.put(url).then(response => {
	log.debug("testNewLoc(): data =>\n", JSON.stringify(response.data, null, "\t"));
	log.debug("testNewLoc(): status = ", response.status)
	log.debug("testNewLoc(): statusText = ", response.statusText);
	// we should not get here, an error shoud be generated and
	// caught belog
	expect(response.status).toBe(400);
	done();
    }).catch(error => {
	//log.error("testNewLoc(): PUT url = ", url);
	if(error.response) {
	    expect(error.response.status).toBe(400);
	    done();
	}
	expect(error).toBeNull();
	done();
    });
});


 



