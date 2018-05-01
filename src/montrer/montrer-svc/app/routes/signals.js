const express = require('express');
const router = express.Router();
const { Client } = require("pg");
const log = require('loglevel');
const logprefix = require("loglevel-plugin-prefix")
const moment = require("moment")
const debug = require('debug')('montrer:signals');
const trace = require('debug')('montrer_trace:signals');

// GLOBAL
//
var gl = {}
gl.signal = {};
const FILE_NAME="signals.js"

//		host: '10.99.149.235',
//		host: 'localhost',
//		host: 'postgresql-svc.default.svc.cluster.local',
const PG_HOST = "postgresql-dep-svc"
const PG_PORT = "50005"

logprefix.apply(log, {
    template: `[%t] ${FILE_NAME}: %l`,
    timestampFormatter: (date) => { return date.toISOString() },
    timestampFormatter: (date) => { return moment().format("YY-MM-DD HH:mm:ss") },
    levelFormatter: (level) => { return level.toUpperCase() + ":" },
    nameFormatter: (name) => { return name || 'global' }
})

log.setLevel("error") 
//log.setLevel("debug") 

//
// INIT
//
// TODO: do proper blocking here
const init =  (async (arg) => {
//    log.debug("init(): start")
//    log.debug("init(): arg = ", arg)
    debug("init(): start")
    debug("init(): arg = ", arg)
    gl.pg = new Client({
	user: "postgres",
	database: "postgres",
	host: PG_HOST,  
	port: PG_PORT
    });

    await gl.pg.connect()
    //    log.debug("init(): after gl.pg.connect()")
    debug("init(): after gl.pg.connect()")

    let sql = "SELECT NOW()";

    await gl.pg.query(sql)
	.then(response => {
	    //	    log.trace("init(): sql check response = ", response)
	    trace("init(): sql check response = ", response)
	})
})
init("blah")
    .then(
	//	log.debug("global: after init()")
	debug("global: after init()")
    )
    .catch( error => {
	log.error("global: init() catch: error =>", error)
    })


/* GET signals */
router.get('/', async (req, res, next) => {

    // SPS - signals per second, always divide by time_window, whic is in seconds
    // SP - signl ratio or total signals in the spw, signal perscentage SP
    // original order:
    // stage1_cluster, stage1_id, beacon_zone, beacon_id, loc_name, \
    
    let signals = [];
    let sql = "WITH signal_window AS ( \
SELECT \
*, \
NOW() as time \
FROM stage1_signal \
WHERE stage1_timestamp > (NOW() - INTERVAL '60s') \
) \
( \
SELECT \
'60s' as time_window, \
loc_name, loc_lonlat, loc_zone, beacon_id, beacon_zone, stage1_id, stage1_zone, stage1_cluster, \
TRUNC(COUNT(*) / 60)::int AS sps, \
ROUND(COUNT(*) * 10.0 / (SELECT COUNT(*) FROM signal_window) * 10.0) AS sp, \
MAX(sw.time) AS last_ts \
FROM signal_window AS sw \
GROUP BY loc_name, loc_lonlat, loc_zone, beacon_id, beacon_zone, stage1_id, stage1_zone, stage1_cluster \
ORDER BY loc_name, loc_zone); "

    await gl.pg.query(sql)
	.then(result => {
	    //	    log.trace("(GET /api/v1/signals/): sql check result = ", result)
	    trace("(GET /api/v1/signals/): sql check result = ", result)
	    let resultJSON = JSON.stringify(result.rows)
//	    log.trace("(GET /api/vs1/signals/): sql check resultJSON = ", resultJSON)
	    trace("(GET /api/vs1/signals/): sql check resultJSON = ", resultJSON)

	    for (let rowID in result.rows) {
//		log.trace("(GET /api/v1/signals/): rowID = ", rowID)
//		log.trace("(GET /api/v1/signals/): resultJSON[rowID] = ", result.rows[rowID])
		trace("(GET /api/v1/signals/): rowID = ", rowID)
		trace("(GET /api/v1/signals/): resultJSON[rowID] = ", result.rows[rowID])
		signals.push({
		    "loc" : {
			"name" : result.rows[rowID].loc_name,
			"lonlat" : result.rows[rowID].loc_lonlat,
			"zone" : result.rows[rowID].loc_zone
		    },
		    "beacon_id" : result.rows[rowID].beacon_id,
		    "beacon_zone" : result.rows[rowID].beacon_zone,
		    "stage1_id" : result.rows[rowID].stage1_id,
		    "stage1_zone" : result.rows[rowID].stage1_zone,
		    "stage1_cluster" : result.rows[rowID].stage1_cluster,
		    "sps" : result.rows[rowID].sps,
		    "sp" : result.rows[rowID].sp,
		    "last_ts" : result.rows[rowID].last_ts
		})
	    }
	    res.send(signals);
	}) // then
    
/*
      signals = [
	{ "stage1_id" : "stage1-1",
	  "stage1_cluster" : "cla",
	  "beacon_id" : "beacon-1",
	  "beacon_zone" : "za",
	  "locpick_id" : "locpick-1",
	  "last_ts" : "2017-12-04 09:01:03",
	  loc : {
	      "name": "loc-1",
	      "lonlat": "50.8386789,4.2931938",
	      "zone": "znozone"
	  }
	},
	{ "stage1_id" : "stage1-2",
	  "stage1_cluster" : "clb",
	  "beacon_id" : "beacon-2",
  	  "beacon_zone" : "zb",
	  "locpick_id" : "locpick-2",
	  "last_ts" : "2017-12-04 09:02:03",
	  loc : {
	      "name": "loc-2",
	      "lonlat": "50.8386789,4.2931938",
	      "zone": "znozone"
	  }
	}
    ];
    res.send(signals);
*/

});

module.exports = router;
