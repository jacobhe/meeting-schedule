/*jslint node: true, vars: true, nomen: true */
'use strict';

var util = require('util');
var logger = require('../loggers').defaultlogger;
var Models = require('../models');
var Meeting = Models.Meeting;
var Department = Models.Department;
var MeetingRoom = Models.MeetingRoom;
var PublicNotice = Models.PublicNotice;
var channel = require('../lib/channel');

// Meeting Page
function insert(req, res) {
    var meeting = req.body;
    logger.info('add meeting by long pulling: ', meeting);
    meeting.lastUpdateTime = new Date();

    if (!meeting.room) {
        logger.error('err: meeting room is null.');
        res.json({ error: true, message: '会议室不能为空。' });
        return;
    }

    Meeting.findMeetingBetween(meeting.date, meeting.startTime, meeting.endTime, meeting.room).exec(function (err, data) {
        if (err) {
            logger.error('err:', err);
            res.json({ error: true, message: '读取数据出错。' });
            return;
        }
        if (data && data.length) {
            logger.error('会议日期时间冲突。', '');
            logger.info('data', data);
            res.json({ error: true, message: '会议日期时间冲突。' });
            return;
        }
        var new_meeting = new Meeting(meeting);
        new_meeting.save(function (err, result) {
            if (err) {
                logger.error('err:', err);
                res.json({ error: true, message: '保存数据出错。' });
            } else {
                res.json({ error: false, password: result.password });
                delete result.password;
                channel.broadcast(result.date, { type: 'new-meeting', meeting: result });
            }
        });
    });
}

function update(req, res) {

    var meeting = req.body;
    logger.info('update meeting by long pulling: ', meeting);
    meeting.lastUpdateTime = new Date();

    Meeting.findMeetingBetween(meeting.date, meeting.startTime, meeting.endTime, meeting.room).exec(function (err, data) {
        var i;

        if (err) {
            logger.error('err:', err);
            res.json({ error: true, message: '读取数据出错。' });
            return;
        }
        if (data && data.length) {
            for (i = 0; i < data.length; i += 1) {
                if (data[i].uuid !== meeting.uuid) {
                    logger.error('会议日期时间冲突。', '');
                    logger.info('data', data);
                    res.json({ error: true, message: '会议日期时间冲突。' });
                    return;
                }
            }
        }
        Meeting.findByIdAndUpdate(meeting._id, {
            $set: {
                title: meeting.title,
                startTime: meeting.startTime,
                endTime: meeting.endTime,
                room: meeting.room,
                date: meeting.date,
                lastUpdateTime: meeting.lastUpdateTime,
                department: meeting.department,
                phone: meeting.phone,
                name: meeting.name,
                equipments: meeting.equipments,
            }
        }).exec(function (err, result) {
            if (err) {
                logger.info('err:', err);
                res.json({ error: true });
            } else {
                channel.broadcast(result.date, { type: 'update-meeting', meeting: result });
                res.json({ error: false });
            }
        });
    });
}

function remove(req, res) {

    var data = req.body;
    logger.info('delete meeting by long pulling: ', data);
    Meeting.findByIdAndRemove(data._id).exec(function (err, result) {
		console.log(result);
        if (err) {
            logger.info('err', err);
            res.json({ error: true });
        } else {
            data.lastUpdateTime = new Date();
            channel.broadcast(data.date, { type: 'delete-meeting', meeting: data });
            res.json({ error: false });
        }
    });
}

function view(req, res) {

    MeetingRoom.findEnabled().exec(function (err, meeting_rooms) {
        if (err || !meeting_rooms) {
            meeting_rooms = [];
        }
        res.render('meetings', { user: req.user, layout: false, meeting_rooms: meeting_rooms });
    });
}

function list(req, res) {
    var date = req.param('date');
    logger.info(util.format('query meeting by long pulling: date=%s', date));
    Meeting.findByDate(date).exec(function (err, results) {
        if (err) {
            logger.info('err:', err);
            res.json({ error: true });
        } else {
            res.json(results);
        }
    });
}

function departments(req, res) {

    Department.find().exec(function (err, departments) {
        if (err || !departments) {
            departments = [];
        }
        res.json(departments);
    });
}

function publicNotices(req, res) {
    PublicNotice.find().exec(function (err, results) {
        if (err || !results) {
            results = [];
        }
        res.json({ notices: results });
    });
}

function confirmPassword(req, res) {
    var meeting = req.body;
    logger.info('confirm password by long pulling: ', meeting);
    Meeting.find({_id: meeting._id, password: meeting.password}).exec(function (err, results) {
        if (err) {
            logger.info('err:', err);
            res.json({ error: true });
        } else {
            if (!results || !results.length) {
                res.json({ error: true });
            } else {
                res.json({ error: false });
            }
        }
    });
}

function comment(req, res) {

    var meeting = req.body;
    logger.info('comment by long pulling: ', meeting);
    Meeting.saveComment(meeting._id, new Date(), -1, function (err, result) {
        if (err) {
            logger.info('err:', err);
            res.json({ error: true });
            return;
        }

        Department.update({
            name: result.department
        }, {
            $inc: {level: -1},
            $set: {lastUpdateTime: result.lastUpdateTime}
        }).exec(function (err, result) {
            if (err) {
                logger.info('update level fail:', err);
            }
            channel.broadcast(result.date, { type: 'select-departments', departments: departments });
        });

        channel.broadcast(result.date, { type: 'update-comment', meeting: result });
        res.json({ error: false });
    });
}

module.exports.insert = insert;
module.exports.update = update;
module.exports.remove = remove;
module.exports.view = view;
module.exports.list = list;
module.exports.departments = departments;
module.exports.publicNotices = publicNotices;
module.exports.confirmPassword = confirmPassword;
module.exports.comment = comment;
