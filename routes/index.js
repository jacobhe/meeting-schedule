/*jslint node: true, vars: true, nomen: true */
'use strict';

var data = require('./data');
var meetings = require('./meetings');
var mobile = require('./mobile');
var templates = require('./templates');
var admin = require('./admin');

/*
 * GET home page.
 */
module.exports.index = function (req, res) {
    res.render('index', { user: null, title: '会议系统' });
};

module.exports.meetings = function (req, res) {
    res.render('meetings', { user: req.user, layout: false });
};

module.exports.admin = admin;
module.exports.data = data;
module.exports.meetings = meetings;
module.exports.mobile = mobile;
module.exports.templates = templates;
