#!/usr/bin/env node

const handlebars  = require("handlebars");
const yargs = require("yargs");
const fs = require("fs");
const child = require("child_process");
const readline = require("readline");
const stream = require("stream");
const log = require("loglevel");
const logprefix = require("loglevel-plugin-prefix");
const dns = require("dns");
const util = require("util");
const http = require("http");
const axhttp = require("axios");
const common = require("common.js");

require("/usr/lib/node_modules/dotenv").config();

//
// LOG
//
const FILE_NAME="reset-locpicks.js";
var LOG_LEVEL = process.env.LOG_LEVEL;

if(typeof LOG_LEVEL === 'undefined') {
    LOG_LEVEL="ERROR";
    log.setLevel(LOG_LEVEL);
    console.log("[%t] reset-logpicks.js: CONSOLE: global: env: LOG_LEVEL is undefined, setting LOG_LEVEL = %s", new Date().toISOString(), LOG_LEVEL.toUpperString());
} else {
    log.setLevel(LOG_LEVEL);
    console.log("[%s] reset-logpicks.js: CONSOLE: global: env: setting LOG_LEVEL = %s", new Date().toISOString(), LOG_LEVEL.toUpperCase());
}

logprefix.apply(log, {
    template: `[%t] ${FILE_NAME}: %l`,
    timestampFormatter: (date) => { return date.toISOString() },
    levelFormatter: (level) => { return level.toUpperCase() + ":" },
    nameFormatter: (name) => { return name || 'global' }
});


//
// GLOBAL INIT
//
log.debug("gobal: start");
log.debug("gobal: NODE_PATH = " + process.env.NODE_PATH);
var gl = {};
//gl.zones = ["z1", "z2"];
gl.zones = ["za", "zb"];

//
// getDnsIP()
//
getDnsIP = () => {
    return new Promise((resolve, reject) => {
	log.debug("getDnsIP(): start");
	//
	// run kubectl get pods -o wide
	//
	child.execFile("kubectl", [
	    "get", "pods", "-o=wide", "--namespace=kube-system"
	], (error, stdout, stderr) => { 
	    if(error) {
		log.error("getDnsIP(): execFile(): could not execute kubectl");
		reject("could not execute kubectl");
	    } else {
		//
		// Parse command output to find kube-dns ip
		//
		let stdoutStream = new stream.Readable();
		stdoutStream.push(stdout);
		stdoutStream.push(null);
		
		const rl = readline.createInterface({
		    input: stdoutStream,
		    crlfDelay: Infinity
		});

		rl.on("line", (line) => {
		    let match = line.match(/^kube-dns|coredns/);

		    if(match) {
			let columns = [];
			let dnsIP;

			log.debug("getDnsIP(): match = " + match);

			line.split(" ").map((part) => {
			    if(part !== "") columns.push(part);
			});

			log.debug("getDnsIP(): columns = " + columns);

			dnsIP = columns[5];
			log.debug("getDnsIP(): dnsIP = " + dnsIP);
			log.debug("getDnsIP(): finish 1");
			resolve(dnsIP);
		    }

		});

		// if match was found, we'll cut out early
		// and will resolve(dnsIP) in on('line')
		rl.on("close", () => {
		    reject("[getDnsIPs]: no match found");
		});
	    }
	});
    })
}

//
// getLocpickIPs
//
getLocpickIPs = (resolver) => {
    // get all locpick ip's from DSN
    return new Promise((resolve,reject) => {
	resolver.resolve4("locpick-dep-hlsvc.default.svc.cluster.local.", (error, ips) => {
	    if(error) {
		reject(error);
	    } else {
		//log.debug("getLocpickIPs(): addresses =>\n", addresses);
		resolve(ips);
	    }
	});
    }); // end promise
}


//
// MAIN
//
(async () => {
    log.debug("main(): start");
    let locpickIPs="";
    
    try {
	// get DNS IP from kubectl
	dnsIP = await getDnsIP();

	const resolver = new dns.Resolver();
	resolver.setServers([dnsIP]);

	locpickIPs = await getLocpickIPs(resolver);

	log.debug("main(): locpickIPs =>\n", locpickIPs);

    } catch (error) { // to catch here to cach anything from the sync routines
	log.error("main(): all sync catch(): error = " + error);
    }

    //
    // loop through lockpick ip's
    //
    let zoneIndex = 0;
    for (let ip of locpickIPs) {
	log.debug("main(): before locpick call");
	zone = gl.zones[zoneIndex++];
	if(zoneIndex == zone.lengh) {
	    zoneIndex = 0;
	}
	log.debug("main(): resetting to zone = ", zone);
	let url = `http://${ip}:${common.LOCPICK_PORT}/reset?zone=${zone}`;
	log.debug("main(): url = " + url);

	try {
	    await (doReset = () => {
		return new Promise((resolve, reject) =>  {
		    axhttp.get(url).then(response => {
			log.debug("main(): doReset(): data =>\n", JSON.stringify(response.data, null, "\t"));
			log.debug("main(): doReset(): status = ", response.status)
			log.debug("main(): doReset(): statusText = ", response.statusText);
			resolve(); // we do done() up the stack acter wait
		    }).catch(error => {
			log.error("main(): doReset(): GET url = ", url);
			log.error("main(): doReset(): could not call locpick, error.message = ", error.message);
			log.error("main(): doReset(): statusCode = ", error.response.status);
			log.error("main(): doReset(): statusCode = ", error.response.data);
			reject(error);
		    }); // end of catch
		}); // end promise
	    })(); // await
	} catch (error) {
	    log.error("main(): try doReset(): could not call locpick, error.message = ", error.message);
	}

	log.debug("main(): after locpick call");
    }
    
    log.debug("main(): finish");

})(); // end main

// global finish after main()
log.debug("global: finish");
