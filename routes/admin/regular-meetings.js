/*jslint node: true, vars: true, nomen: true */
'use strict';

var logger = require('../../loggers').defaultlogger;
var Models = require('../../models');
var Meeting = Models.Meeting;
var _s = require('underscore.string');
var moment = require('moment');
var channel = require('../../lib/channel');
var ObjectId = Models.ObjectId;

function list(req, res) {

    var start_date = _s.trim(req.param('start-date') || '');
    var end_date = _s.trim(req.param('end-date') || '');
    var room = _s.trim(req.param('room') || '');
    var department = _s.trim(req.param('department') || '');

    Models.getMeetingRoomsAndDepartments(function (err, meeting_rooms, departments) {
        if (err) {
            res.json({error: true});
            return;
        }
        Meeting.findRegularMeetings(start_date, end_date, room, department).exec(function (err, results) {
            var today = moment(new Date());
            var end_date2;
            var time_diff;
            var i;

            if (err || !results) {
                results = [];
            }
            moment.lang('en');
            for (i = 0; i < results.length; i += 1) {
                end_date2 = moment(results[i].endDate, 'YYYY-MM-DD');
                time_diff = end_date2.diff(today, 'days');
                if (time_diff <= 0) {
                    results[i].alert = 'gray';
                } else if (time_diff <= 7) {
                    results[i].alert = 'error';
                } else if (time_diff <= 14) {
                    results[i].alert = 'info';
                } else {
                    results[i].alert = '';
                }
            }
            res.render('regular-meetings', {
                page_type: 'regular-meetings',
                user: req.user,
                regular_meetings: results,
                title: '管理常规会议 Manage Regular Meetings',
                start_date: start_date,
                end_date: end_date,
                room: room,
                department: department,
                meeting_rooms: meeting_rooms,
                departments: departments,
            });
        });
    });
}

function insert(req, res) {
    var regular_meeting;
    var meetings = [];
    regular_meeting = req.body;
    logger.info('add regular meeting:', regular_meeting);

    var object_id = new ObjectId();
    regular_meeting.lastUpdateTime = new Date();
    regular_meeting._id = object_id;
    regular_meeting.regularMeetingId = regular_meeting._id;
    regular_meeting.regular = true;
    regular_meeting.conflict = [];

    var moment1 = moment(regular_meeting.startDate, 'YYYY-MM-DD');
    var today = moment(new Date());
    moment1 = moment1 >= today ? moment1 : today;
    var moment2 = moment(regular_meeting.endDate, 'YYYY-MM-DD');

    meetings.push(regular_meeting);
    var query_date = [];
    var start_date;
    var end_date;
    var i;

    if (regular_meeting.weeknum) {
        switch (regular_meeting.weeknum) {
        case '第一周':
            start_date = 1;
            end_date = 7;
            break;
        case '第二周':
            start_date = 8;
            end_date = 14;
            break;
        case '第三周':
            start_date = 15;
            end_date = 21;
            break;
        case '第四周':
            start_date = 22;
            end_date = 28;
            break;
        case '第五周':
            start_date = 29;
            end_date = 31;
            break;
        }
    }

    while (moment1 <= moment2) {
        if (regular_meeting.frequency === 'weekly') {
            for (i = 0; i < regular_meeting.days.length; i += 1) {
                if (moment1.day() === regular_meeting.days[i]) {
                    meetings.push({
                        'title': regular_meeting.title,
                        'startTime': regular_meeting.startTime,
                        'endTime': regular_meeting.endTime,
                        'department': regular_meeting.department,
                        'name': regular_meeting.name,
                        'phone': regular_meeting.phone,
                        'room': regular_meeting.room,
                        'date': moment1.format('YYYY-MM-DD'),
                        'day': moment1.day(),
                        'scope': 0,
                        'equipments': regular_meeting.equipments,
                        'lastUpdateTime': new Date(),
                        'regularMeetingId': regular_meeting._id,
                    });
                    query_date.push(moment1.format('YYYY-MM-DD'));
                }
            }
            moment1.add({ d: 1 });
        } else if (regular_meeting.frequency === 'monthly') {
            for (i = 0; i < regular_meeting.days.length; i += 1) {
                if (moment1.day() === regular_meeting.days[i] && start_date <= moment1.date()  && moment1.date() <= end_date) {
                    meetings.push({
                        'title': regular_meeting.title,
                        'startTime': regular_meeting.startTime,
                        'endTime': regular_meeting.endTime,
                        'department': regular_meeting.department,
                        'name': regular_meeting.name,
                        'phone': regular_meeting.phone,
                        'room': regular_meeting.room,
                        'date': moment1.format('YYYY-MM-DD'),
                        'day': moment1.day(),
                        'scope': 0,
                        'equipments': regular_meeting.equipments,
                        'lastUpdateTime': new Date(),
                        'regularMeetingId': regular_meeting._id,
                    });
                    query_date.push(moment1.format('YYYY-MM-DD'));
                }
            }
            moment1.add({ d: 1 });
        } else {
            break;
        }
    }

    Meeting.findMeetingBetween(query_date, regular_meeting.startTime, regular_meeting.endTime, regular_meeting.room).exec(function (err, data) {
        var i;
        var j;
        if (err) {
            logger.error('err:', err);
            res.json({ error: true, message: '保存数据出错。' });
            return;
        }
        if (data && data.length) {
            logger.error('会议日期时间冲突。', '');
            logger.info('conflicted meetins: ', data);
            for (i = 0; i < data.length; i += 1) {
                for (j = 1; j < meetings.length; j += 1) {
                    if (data[i].date === meetings[j].date) {
                        regular_meeting.conflict.push(meetings.splice(j, 1)[0]);
                        break;
                    }
                }
            }
        }
        if (meetings.length < 2) {
            logger.error('无法添加符合选择时间区间内的会议。', '');
            res.json({ error: true, message: '无法添加符合选择时间区间内的会议。' });
            return;
        }
        Meeting.create(meetings, function (err, regular_meeting, meeting) {
            if (err) {
                logger.error('err', err);
                res.json({ error: true, message: '保存数据出错。' });
            } else {
                channel.broadcast(meeting.date, { type: 'new-meeting', meeting: meeting });
                if (data && data.length) {
                    res.json({ error: true, message: '常规会议已经添加，但存在日期时间冲突的会议。' });
                } else {
                    res.json({ error: false });
                }
            }
        });
    });
}

function update(req, res) {
    var regular_meeting;
    var meetings = [];

    regular_meeting = req.body;
    logger.info('update regular meeting:', regular_meeting);
    regular_meeting.lastUpdateTime = new Date();
    regular_meeting.regularMeetingId = regular_meeting._id;
    regular_meeting.regular = true;
    regular_meeting.conflict = [];

    var moment1 = moment(regular_meeting.startDate, 'YYYY-MM-DD');
    var today = moment(new Date());
    moment1 = moment1 >= today ? moment1 : today;
    var moment2 = moment(regular_meeting.endDate, 'YYYY-MM-DD');

    meetings.push(regular_meeting);
    var query_date = [];
    var start_date;
    var end_date;
    var i;

    if (regular_meeting.weeknum) {
        switch (regular_meeting.weeknum) {
        case '第一周':
            start_date = 1;
            end_date = 7;
            break;
        case '第二周':
            start_date = 8;
            end_date = 14;
            break;
        case '第三周':
            start_date = 15;
            end_date = 21;
            break;
        case '第四周':
            start_date = 22;
            end_date = 28;
            break;
        case '第五周':
            start_date = 29;
            end_date = 31;
            break;
        }
    }

    while (moment1 <= moment2) {
        if (regular_meeting.frequency === 'weekly') {
            for (i = 0; i < regular_meeting.days.length; i += 1) {
                if (moment1.day() === regular_meeting.days[i]) {
                    meetings.push({
                        'title': regular_meeting.title,
                        'startTime': regular_meeting.startTime,
                        'endTime': regular_meeting.endTime,
                        'department': regular_meeting.department,
                        'name': regular_meeting.name,
                        'phone': regular_meeting.phone,
                        'room': regular_meeting.room,
                        'date': moment1.format('YYYY-MM-DD'),
                        'day': moment1.day(),
                        'scope': 0,
                        'equipments': regular_meeting.equipments,
                        'lastUpdateTime': new Date(),
                        'regularMeetingId': regular_meeting._id,
                    });
                    query_date.push(moment1.format('YYYY-MM-DD'));
                }
            }
            moment1.add({ d: 1 });
        } else if (regular_meeting.frequency === 'monthly') {
            for (i = 0; i < regular_meeting.days.length; i += 1) {
                if (moment1.day() === regular_meeting.days[i] && start_date <= moment1.date() && moment1.date() <= end_date) {
                    meetings.push({
                        'title': regular_meeting.title,
                        'startTime': regular_meeting.startTime,
                        'endTime': regular_meeting.endTime,
                        'department': regular_meeting.department,
                        'name': regular_meeting.name,
                        'phone': regular_meeting.phone,
                        'room': regular_meeting.room,
                        'date': moment1.format('YYYY-MM-DD'),
                        'day': moment1.day(),
                        'scope': 0,
                        'equipments': [],
                        'lastUpdateTime': new Date(),
                        'regularMeetingId': regular_meeting._id
                    });
                    query_date.push(moment1.format('YYYY-MM-DD'));
                }
            }
            moment1.add({ d: 1 });
        } else {
            break;
        }
    }

    Meeting.findMeetingsNotContainRegularMeetingId(query_date, regular_meeting.startTime, regular_meeting.endTime, regular_meeting.room, regular_meeting._id).exec(function (err, data) {
        var i;
        var j;

        if (err) {
            logger.error('err:', err);
            res.json({ error: true, message: '读取数据出错。' });
            return;
        }
        if (data && data.length) {
            logger.error('会议日期时间冲突。', '');
            logger.info('data', data);
            logger.info('conflicted meetins: ', data);
            for (i = 0; i < data.length; i += 1) {
                for (j = 1; j < meetings.length; j += 1) {
                    if (data[i].date === meetings[j].date) {
                        regular_meeting.conflict.push(meetings.splice(j, 1)[0]);
                        break;
                    }
                }
            }
        }
        console.log(meetings);
        if (meetings.length < 2) {
            logger.error('无法添加符合选择时间区间内的会议。', '');
            res.json({ error: true, message: '无法添加符合选择时间区间内的会议。' });
            return;
        }
        Meeting.remove({regularMeetingId: regular_meeting._id}, function (err) {
            if (err) {
                logger.error('error delete regular meeting:', err);
                res.json({ error: true, message: '保存数据出错。' });
                return;
            }
            Meeting.create(meetings, function (err, regular_meeting, meeting) {
                if (err) {
                    logger.error('err', err);
                    res.json({ error: true, message: '保存数据出错。' });
                } else {
                    channel.broadcast(meeting.date, { type: 'new-meeting', meeting: meeting });
                    if (data && data.length) {
                        res.json({ error: true, message: '常规会议已经添加，但存在日期时间冲突的会议。' });
                    } else {
                        res.json({ error: false });
                    }
                }
            });
        });
    });
}

function remove(req, res) {

    logger.info('delete regular meeting: ', req.param('_id'));

    Meeting.remove({regularMeetingId: req.param('_id')}).exec(function (err) {
        if (err) {
            logger.info('err:', err);
            res.json({ error: true, message: '删除常规会议出错。' });
        } else {
            res.json({ error: false });
        }
    });
}

module.exports.insert = insert;
module.exports.list = list;
module.exports.update = update;
module.exports.remove = remove;
