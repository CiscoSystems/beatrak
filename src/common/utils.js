const moment = require('moment');

//
// util module for beatrak
//

// REST
// respnose is express res, req (for options), reponse is our object

LOADED = true;

const sendResponse = (res, req, response) => {
    if(typeof req.query.pretty !== 'undefined') {
	res.send(JSON.stringify(response, null, "\t"));
    } else {
	res.send(JSON.stringify(response));
    }
}

const returnSuccess = (res, req, response) => { 
    res.status(200)
    sendResponse(res, req, response); 
}

const m = (message, arg1) => {
    return moment().format('YYYY-MM-DDTHH:mm:ssZ') + " " + message + ((typeof arg1 === 'undefined') ? "" : JSON.stringify(arg1, null, "\t"));
}

const sleep = (ms) => new Promise(resolve => {
    setTimeout(resolve,ms);
});

const expBackoff = (attempt, delay) => {
    return new Promise(async (resolve, reject) => {
	let ms = Math.random() * Math.pow(2, attempt) * delay;
	console.log(m(`expBackoff(): starting to wait for ${ms}(ms)`));
	await sleep(ms)
	    .then(() => { 
		console.log(m(`expBackoff(): done waiting`));
		resolve(ms) 
	    })
	    .catch( error => { reject(error) })
    });
}


//module.exports.sendResponse = sendResponse;
//module.exports.returnSuccess = returnSuccess;

module.exports = {
    LOADED : LOADED,
    sendResponse : sendResponse,
    returnSuccess : returnSuccess,
    m : m,
    sleep : sleep,
    expBackoff : expBackoff
}









