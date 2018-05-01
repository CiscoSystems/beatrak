#!/usr/bin/env node

console.log("GLOBAL: CONSOLE: NODE_PATH=", process.env.NODE_PATH)

const util = require("util")
const handlebars  = require("handlebars")
const yargs = require("yargs")
const fs = require("fs")
const child = require("child_process")
const execFile = util.promisify(require("child_process").execFile);
const exec = util.promisify(require("child_process").exec);
const readline = require("readline")
const stream = require("stream")
const log = require("loglevel")
const logprefix = require("loglevel-plugin-prefix")
const dns = require("dns")
const http = require("http")
const axhttp = require("axios")
const common = require("common")
const moment = require("moment")
const path = require("path")

require("/usr/lib/node_modules/dotenv").config()

//
// LOG
//
const FILE_NAME="config-beacons.js"
var LOG_LEVEL = process.env.LOG_LEVEL
var CONFIG_FILE = process.env.CONFIG_FILE

if(typeof LOG_LEVEL === 'undefined') {
    LOG_LEVEL="ERROR"
    log.setLevel(LOG_LEVEL)
    console.log("GLOBAL: CONSOLE: LOG_LEVEL is undefined, setting LOG_LEVEL = %s", LOG_LEVEL)
} else {
    log.setLevel(LOG_LEVEL)
    console.log("GLOBAL: CONSOLE: LOG_LEVEL = %s", LOG_LEVEL)
}

if(typeof CONFIG_FILE === 'undefined') {
    CONFIG_FILE = "./envoy-configs/envoy-new.json"
    console.log("GLOBAL: CONSOLE: CONFIG_FILE is undefined, setting CONFIG_FILE = %s", CONFIG_FILE)
} else {
    console.log("GLOBAL: CONSOLE: CONFIG_FILE =  %s", CONFIG_FILE)
}


logprefix.apply(log, {
    template: `[%t] ${FILE_NAME}: %l`,
    timestampFormatter: (date) => { return date.toISOString() },
    timestampFormatter: (date) => { return moment().format("YY-MM-DD HH:mm:ss") },
    levelFormatter: (level) => { return level.toUpperCase() + ":" },
    nameFormatter: (name) => { return name || 'global' }
})


//
// GLOBAL INIT
//
log.debug("global: start")
log.debug("global: NODE_PATH = " + process.env.NODE_PATH)
var gl = {}
gl.zones = ["za", "zb"]

//
// getDnsIP()
//
const getDnsIP = () => {
    return new Promise((resolve, reject) => {
	log.debug("getDnsIP(): start")
	//
	// run kubectl get pods -o wide
	//
	child.execFile("kubectl", [
	    "get", "pods", "-o=wide", "--namespace=kube-system"
	], (error, stdout, stderr) => { 
	    if(error) {
		log.error("getDnsIP(): execFile(): could not execute kubectl")
		reject("could not execute kubectl")
	    } else {
		//
		// Parse command output to find kube-dns ip
		//
		let stdoutStream = new stream.Readable()
		stdoutStream.push(stdout)
		stdoutStream.push(null)
		
		const rl = readline.createInterface({
		    input: stdoutStream,
		    crlfDelay: Infinity
		})

		rl.on("line", (line) => {
		    let match = line.match(/^kube-dns/)

		    if(match) {
			let columns = []
			let dnsIP

			log.debug("getDnsIP(): match = " + match)

			line.split(" ").map((part) => {
			    if(part !== "") columns.push(part)
			})

			log.debug("getDnsIP(): columns = " + columns)

			dnsIP = columns[5]
			log.debug("getDnsIP(): dnsIP = " + dnsIP)

			resolve(dnsIP)
		    }

		})

		// if match was found, we'll cut out early
		// and will resolve(dnsIP) in on('line')
		rl.on("close", () => {
		    reject("no match found")
		})
	    }
	})
    })
}

//
// getLocpickIPs
//
const getLocpickIPs = (resolver) => {
    // get all locpick ip's from DSN
    return new Promise((resolve,reject) => {
	resolver.resolve4("locpick.default.svc.cluster.local.", (error, ips) => {
	    if(error) {
		reject(error)
	    } else {
		//log.debug("getLocpickIPs(): addresses =>\n", addresses)
		resolve(ips)
	    }
	})
    }) // end promise
}

//
// getBeaconZAIPs
//
const getBeaconZAIPs = (resolver) => {
    // get all locpick ip's from DSN
    return new Promise((resolve,reject) => {
	resolver.resolve4("beacon-za.default.svc.cluster.local.", (error, ips) => {
	    if(error) {
		reject(error)
	    } else {
		//log.debug("getLocpickIPs(): addresses =>\n", addresses)
		resolve(ips)
	    }
	})
    }) // end promise
}

//
// getBeaconZAIPs
//
const getBeaconZBIPs = (resolver) => {
    // get all locpick ip's from DSN
    return new Promise((resolve,reject) => {
	resolver.resolve4("beacon-zb.default.svc.cluster.local.", (error, ips) => {
	    if(error) {
		reject(error)
	    } else {
		//log.debug("getLocpickIPs(): addresses =>\n", addresses)
		resolve(ips)
	    }
	})
    }) // end promise
}

const getBeaconPodNames = () => {
    return new Promise((resolve, reject) => {
	let beaconPodNames = [];
	child.execFile("kubectl", [
	    "get", "pods", "-o=wide", "--namespace=default"
	], (error, stdout, stderr) => { 
	    if(error) {
		log.error("getDnsIP(): execFile(): could not execute kubectl")
		reject("getBeaconPodNames(): REJECT: could not execute kubectl")
	    } else {

		let stdoutStream = new stream.Readable()
		stdoutStream.push(stdout)
		stdoutStream.push(null)
		
		const rl = readline.createInterface({
		    input: stdoutStream,
		    crlfDelay: Infinity
		})

		rl.on("line", (line) => {
		    let match = line.match(/^beacon-z/)
		    if(match) {
			let columns = []
			log.debug("getBeaconPodNames(): match = " + match)
			line.split(" ").map((part) => {
			    if(part !== "") columns.push(part)
			})
			log.debug("getBeaconPodNames(): columns = " + columns)
			let beaconName = columns[0]
			log.debug("getBeaconPodNames(): beaconName = " + beaconName)
			beaconPodNames.push(beaconName);
		    }
		})

		rl.on("close", () => {
		    if(beaconPodNames.length != 0) {
			resolve(beaconPodNames)
		    } else {
			reject("getBeaconPodNames(): REJECT: did not find beacons")
		    }
		})

	    }
	 }  // execFile error
       ) // execFile 
    }) // promise
} // func

const configBeacon = (beaconPodName) => {
    return new Promise(async (resolve, reject) => {
	log.debug("configBeacon(): pod %s start config...", beaconPodName)
				     
        await exec("kubectl cp " + CONFIG_FILE + " " + beaconPodName + ":/" + path.basename(CONFIG_FILE) + " -c envoy")
	.catch(error => {
	    reject("configBeacon(): REJECT: " + error)

        })

        await exec("kubectl exec " + beaconPodName + " -c envoy -- /bin/bash -c \"cp -f /envoy.json /envoy.old.json; cp -f /" + path.basename(CONFIG_FILE) + " /envoy.json;\"")
	.catch(error => {
	    reject("configBeacon(): REJECT: " + error)
        })
	await exec("kubectl exec " + beaconPodName + " -c envoy -- /restart-envoy.sh")
	log.debug("configBeacon(): pod %s done", beaconPodName)
	resolve(); // reject will be caught at the higher level for now

    }) // promise
}


//
// MAIN 
//
const main = (async () => {

    let beaconPodNames = await getBeaconPodNames()
    log.debug("main(): beaconPodNames = ", beaconPodNames)

    for (let name of beaconPodNames) {
	await configBeacon(name);
    }


      log.debug("main(): finish");
    return 0 // success
	   
    log.debug("main(): finish");
})

log.debug("global: finish")

main()
    .then(retval => {
	log.debug("main(): overall then: retval =>", retval)
    })
    .catch(error => {
	log.error("main(): overall catch: error =>", error)
	process.exit(1);
    })

