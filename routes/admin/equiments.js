/*jslint node: true, vars: true, nomen: true */
'use strict';

var logger = require('../../loggers').defaultlogger;
var Models = require('../../models');
var Equipment = Models.Equipment;

// equipments
function list(req, res) {

    Equipment.find().exec(function (err, results) {
        if (err || !results) {
            results = [];
        }
        res.render('equipments', { page_type: 'equipments', user: req.user, equipments: results, title: 'Manage Equipments' });
    });
}

function insert(req, res) {

    var data = req.body;
    data.lastUpdateTime = new Date();

    var equipment = new Equipment(data);
    equipment.save(function (err) {
        if (err) {
            logger.info('err:', err);
            res.json({ error: true });
            return;
        }
        res.json({ error: false });
    });
}

function remove(req, res) {

    Equipment.findByIdAndRemove(req.param('_id')).exec(function (err) {
        if (err) {
            logger.info('err:', err);
            res.json({ error: true });
            return;
        }
        res.json({ error: false });
    });
}

module.exports.list = list;
module.exports.insert = insert;
module.exports.remove = remove;
