/*jslint node: true, vars: true, nomen: true */
'use strict';

var logger = require('../../loggers').defaultlogger;
var Models = require('../../models');
var PublicNotice = Models.PublicNotice;

// Public notice
function list(req, res) {

    PublicNotice.find().exec(function (err, results) {
        if (err || !results) {
            results = [];
        }
        res.render('public-notices', { page_type: 'public-notices', user: req.user, notices: results, title: 'Manage Public Noties' });
    });
}

function insert(req, res) {

    var notice = new PublicNotice({
        content: req.param('content'),
        lastUpdateTime: new Date()
    });
    notice.save(function (err) {
        if (err) {
            logger.info('err:', err);
        }
        res.json({ error: err ? true : false });
    });
}

function update(req, res) {
    var updates = {
        $set: {
            content: req.param('content'),
            lastUpdateTime: new Date()
        }
    };
    PublicNotice.findByIdAndUpdate(req.param('_id'), updates).exec(function (err) {
        if (err) {
            logger.info('err:', err);
        }
        res.json({ error: err ? true : false });
    });
}

function remove(req, res) {

    PublicNotice.findByIdAndRemove(req.param('_id')).exec(function (err) {
        if (err) {
            logger.info('err:', err);
        }
        res.json({ error: err ? true : false });
    });
}

module.exports.list = list;
module.exports.insert = insert;
module.exports.update = update;
module.exports.remove = remove;
