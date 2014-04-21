/*jslint node: true, vars: true, nomen: true */
/*global emit */
'use strict';

var Models = require('../models');
var UA = Models.UA;
var fs = require('fs');
var path = require('path');
var blank_gif = fs.readFileSync(path.resolve(__dirname, '../public/images/blank.gif'));

function saveAnalyticsData(req, res) {
    var doc = req.query;
    var p;

    res.writeHead(200, { 'Content-Type': 'image/gif' });
    res.end(blank_gif, 'binary');

    for (p in doc) {
        switch (p) {
        case 'ua':
        case 'u':
        case 'r':
            doc[p] = new Buffer(doc[p], 'base64').toString();
            break;
        }
    }
    var ua = new UA(doc);
    ua.save();
}

function countEngines(req, res) {

    var o = {};

    // Map function
    o.map = function () {
        emit(this.engine, 1);
    };
    // Reduce function
    o.reduce = function (k, vals) {
        var sum = 0;
        var i;
        for (i = 0; i < vals.length; i += 1) {
            sum += vals[i];
        }
        return sum;
    };

    o.out =  { inline: 1 };
    o.verbose = true;

    // Peform the map reduce
    UA.mapReduce(o, function (err, results) {
        if (err) {
            res.json(err);
            return;
        }
        res.json(results);
    });
}

function countBrowsers(req, res) {

    var o = {};

    // Map function
    o.map = function () {
        emit(this.browser, 1);
    };
    // Reduce function
    o.reduce = function (k, vals) {
        var sum = 0;
        var i;
        for (i = 0; i < vals.length; i += 1) {
            sum += vals[i];
        }
        return sum;
    };

    o.out =  { inline: 1 };
    o.verbose = true;

    // Peform the map reduce
    UA.mapReduce(o, function (err, results) {
        if (err) {
            res.json(err);
            return;
        }
        res.json(results);
    });
}

module.exports.countEngines = countEngines;
module.exports.saveAnalyticsData = saveAnalyticsData;
module.exports.countBrowsers = countBrowsers;
