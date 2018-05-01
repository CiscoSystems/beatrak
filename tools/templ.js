#!/usr/bin/env node

var handlebars  = require("handlebars");
var handlebarsIntl  = require("handlebars-intl");
handlebarsIntl.registerWith(handlebars);
var yargs = require("yargs");
var fs = require("fs");
require("dotenv").config();

console.log("templ.js: starting...");
console.log("templ.js: NODE_PATH = " + process.env.NODE_PATH);

argv = yargs.usage("usage: $0 <options>")
    .example("templ.js -t service.yaml.templ -d \'{\"name\" : \"service1\"}\' -f service-za.yaml")
    .alias("t","templ")
    .nargs("t", 1)
    .describe("t", "template file")
    .demandOption("t")
    .alias("d","data")
    .nargs("d", 1)
    .describe("d", "data json")
    .demandOption("d")
    .alias("f","file")
    .nargs("f", 1)
    .describe("f", "output file");

fs.readFile("./" + yargs.argv.templ, "utf8", (error, templ) => {
    if(error) {
	console.log("templ.js: ERROR: can't read templ file: " + yargs.argv.templ);  
	process.exit();
    } else {
	var template = handlebars.compile(templ);

	var data;
	try {
	    data = JSON.parse(yargs.argv.data);
	} catch (e) {
	    console.log("templ.js: ERROR: can't read data json, error = " + e);
	    process.exit();
	}
	var result = template(data);
	// console.log(result);
	

	var fileName;
	if(yargs.argv.file) {
	    fileName = yargs.argv.file;
	} else {
	    fileName = yargs.argv.templ.replace(/\.[^/.]+$/, "")
	}

	fs.writeFile(fileName, result, (error) => {
	    if (error)  {
		console.log("templ.js: ERROR: can't write result file: " + fileName);  
		process.exit();
	    }
	    console.log("templ.js: SUCCES: wrote to result file: " + fileName);  
	});

    }
});

console.log("templ.js: templ = " + yargs.argv.templ);
console.log("templ.js: data = " + yargs.argv.data);
