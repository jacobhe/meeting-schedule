/*jslint node: true, vars: true, nomen: true */
'use strict';

var util = require('util');
var logger = require('../loggers').defaultlogger;
var moment = require('moment');
var Models = require('../models');
var Meeting = Models.Meeting;

function list(req, res) {
    var date = req.param('date');
    if (!date) {
        date = moment(new Date()).format('YYYY-MM-DD');
    }
    logger.info(util.format('mibile request query meeting list: date=%s', date));
    Meeting.find({date: date}).exec(function (err, results) {
        if (err) {
            logger.info('err:', err);
            res.render('mobile/error', { layout: 'mobile/layout', title: 'Error' });
            return;
        }
        res.render('mobile/list', { layout: 'mobile/layout', title: 'Meeting List', meetings: results });
    });
}

function view(req, res) {
    var _id = req.params._id;
    logger.info(util.format('mibile request view meeting: id=%s', _id));
    Meeting.findById(_id).exec(function (err, results) {
        if (err) {
            logger.info('err:', err);
            res.render('mobile/error', { layout: 'mobile/layout', title: 'Error' });
            return;
        }
        if (!results || !results.length) {
            logger.info('err:', util.format('can\'t find meeting: %s', _id));
            res.render('mobile/error', { layout: 'mobile/layout', title: 'Error' });
            return;
        }
        res.render('mobile/view', { layout: 'mobile/layout', title: 'Meeting', meeting: results[0] });
    });
}

module.exports.list = list;
module.exports.view = view;
