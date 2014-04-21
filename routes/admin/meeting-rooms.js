/*jslint node: true, vars: true, nomen: true */
'use strict';

var util = require('util');
var logger = require('../../loggers').defaultlogger;
var Models = require('../../models');
var Meeting = Models.Meeting;
var Equipment = Models.Equipment;
var Department = Models.Department;
var MeetingRoom = Models.MeetingRoom;

// meeting room
function list(req, res) {

    MeetingRoom.find().exec(function (err, results) {
        if (!results) {
            results = [];
        }
        res.render('meeting-rooms', { page_type: 'meeting-rooms', user: req.user, meeting_rooms: results, title: 'Manage Meeting Rooms' });
    });
}

function insert(req, res) {

    var data = req.body;
    data.lastUpdateTime = new Date();

    var meeting_room = new MeetingRoom(data);
    meeting_room.save(function (err, results) {
        if (err) {
            logger.info('err:', err);
        }
        res.json({ error: err ? true : false });
    });
}

function remove(req, res) {

    MeetingRoom.findByIdAndRemove(req.param('_id')).exec(function (err) {
        if (err) {
            logger.info('err:', err);
        }
        res.json({ error: err ? true : false });
    });
}

function changeStatus(req, res) {

    var meeting_room = req.body;
    MeetingRoom.findByIdAndUpdate(meeting_room._id, {
        $set: {
            enabled: meeting_room.enabled,
            lastUpdateTime: new Date()
		}
	}).exec(function (err) {
        if (err) {
            logger.info('err:', err);
        }
        res.json({ error: err ? true : false });
    });
}

module.exports.list = list;
module.exports.insert = insert;
module.exports.remove = remove;
module.exports.changeStatus = changeStatus;
