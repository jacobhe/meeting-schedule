/*jslint node: true, vars: true, nomen: true */
'use strict';

var logger = require('../loggers').defaultlogger;
var fs = require('fs');
var path = require('path');
var moment = require('moment');
var spawn = require('child_process').spawn;

function run() {
    try {
        logger.info('running backup ...');
        var today = moment(new Date());
        var tomorrow = moment([today.year(), today.month(), today.date() + 1]);
        var time_diff = tomorrow.diff(today, 'seconds');
        fs.exists(path.resolve(__dirname, 'backup/backup-' + today.format('YYYY-MM-DD') + '.tar.gz'), function (exists) {
            var backup;
            if (!exists) {
                backup = spawn('node', ['backup.js']);
                backup.on('exit', function (code) {
                    logger.info('backup finished with code ', code);
                });
            } else {
                logger.info('already backup.');
            }
            setTimeout(run, time_diff * 1000);
        });
    } catch (e) {

    }
}

module.exports.run = run;
