/*
 *
 * SERVER
 *
 */

//
// GLOBAL
//
var gl = {}

//
// ENV
//
var PORT;

if(typeof process.env.PORT === 'undefined' || process.env.PORT == "") {
    console.log("obus-server: env: PORT is undefined, setting PORT to 60001");
    PORT = 60001
} else {
    PORT = process.env.PORT;
    console.log("obus-server: env: PORT = " + PORT);
}

if(typeof process.env.ID === 'undefined' || process.env.ID == "") {
    gl.sid = "obus-server-" + Math.random().toString(36).substring(8);
    console.log("obus-server: env: ID is undefined, setting SID to " + gl.sid);
} else {
    gl.sid = "obus-server-" + process.env.ID;
    console.log("obus-server: env: setting SID to " + gl.sid);
}


SERVER_URL="localhost:" + PORT;

console.log("log: obus-server: start...");

const PROTO_PATH = __dirname + "/../protos/obus.proto";

console.log("PROTO_PATH = " + PROTO_PATH);

const grpc = require('grpc');
const obusProto = grpc.load(PROTO_PATH).obus;
const utils = require("./common/utils.js")

//
// ping
//
const ping = (call, callback) => {
    const response = {ServerID: `${gl.sid}`, Pong: `SIMPLE: callback(): ${gl.sid}=>${call.request.ClientID}`};
    console.log(`log: obus-server: ping(): {callback} response = ${JSON.stringify(response)}`);
    callback(null, response);
}

//
// pingStreamFromServer
//
const pingStreamFromServer = (call) => {
    // SS -> server stream
    var labels = ["SS1", "SS2", "SS3"];

    labels.forEach(label => {
	const response = {ServerID:`${gl.sid}`, Pong: `SERVER_STREAM: write(): ${gl.sid}=>${call.request.ClientID}, ${label}`};
	console.log(`log: obus-server: pingStreamFromServer(): {write} response = ${JSON.stringify(response)}`);
	call.write(response);
    });
    call.end();
}
//
// pingStreamFromClient
//
function pingStreamFromClient(call, callback) {
    var clientID;
    var requestCount = 0;
    call.on('data', (request) => {
	console.log(`log: obus-server: pingStreamFromClient(): {data}: received request = ${JSON.stringify(request)}`);
	clientID = request.ClientID;
	requestCount++;
    });
    call.on('end', function() {
	const response = {ServerID: `${gl.sid}`, Pong: `CLIENT_STREAM: callback(): ${gl.sid}=>${clientID},requestCount = ${requestCount}`};
	console.log("log: obus-server: pingStreamFromClient(): {end}: client done sending");
	console.log(`log: obus-server: pingStreamFromClient(): {end}: send response = ${JSON.stringify(response)}`);
	callback(null, response);
    });
}

const pingStreamFromBoth = (call) => {
    var clientID;
    var requestCount = 0;
    call.on('data', (request) => {
	console.log(`log: obus-server: pingStreamFromBoth(): {data}: received request = ${JSON.stringify(request)}`);
	clientID = request.ClientID;
	requestCount++;
	const response = {ServerID: `${gl.sid}`, Pong: `BOTH_STREAM: server call.on(data): write(): ${gl.sid}=>${clientID},requestCount = ${requestCount}`};
	console.log(`log: obus-server: pingStreamFromServer(): {write} response = ${JSON.stringify(response)}`);
	call.write(response);
    });

    call.on('end', () => {
	console.log(`log: obus-server: pingStreamFromServer(): {end} client done sending`);
	call.end();
    });
}


const main = () => {
  const server = new grpc.Server();
    server.addService(obusProto.Pinger.service, {
	ping: ping,
	pingStreamFromServer,
	pingStreamFromClient,
	pingStreamFromBoth,
    })

    server.bind(SERVER_URL, grpc.ServerCredentials.createInsecure())
    server.start()

    // TODO: cdmitri: dig into the wrapper code,
    //       there should be a better way to detect
    //       errors here, right now nothing
    //       is thrown
    if (server.started == true) {
	console.log("log: obus-server: OK: listening on PORT=" + PORT)
    } else {
	console.error("log: obus-server: ERROR: did not start on PORT=" + PORT)
    }
}

main()
