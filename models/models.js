/*jslint node: true, nomen: true, vars: true */
'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var app_conf = require('../app-conf');

var schema_options = {
    safe: { w: '1'},
    versionKey: false
};

var connection_options = {
    server: {
        socketOptions: {
            keepAlive: 1
        }
    }
};
var mongodb_urls = [];
app_conf.get('db_hosts').forEach(function (server) {
    mongodb_urls.push('mongodb://' + server.host + ':' + server.port  + '/' + app_conf.get('dbname'));
});

mongoose.connect(mongodb_urls.join(','), connection_options);

var MeetingSchema = new Schema({
    title: String,
    startTime: String,
    endTime: String,
    department: String,
    name: String,
    phone: String,
    room: String,
    date: String,
    scope: Number,
    equipments: [String],
    password: String,
    lastUpdateTime: Date,
    regular: Boolean,
    startDate: String,
    endDate: String,
    regularMeetingId: Schema.Types.ObjectId,
    frequency: String,
    conflict: [],
    days: [],
    weeknum: String
}, schema_options);

MeetingSchema.statics.findByDate = function (date, cb) {

    if (cb) {
        return this.find({ date: date }).exec(cb);
    }
    return this.find({ date: date });
};

MeetingSchema.statics.findMeetingBetween = function (dates, startTime, endTime, room, cb) {

    if (!Array.isArray(dates)) {
        dates = [dates];
    }

    var query = this.find({
        date: {$in: dates},
        room: room,
        $or: [
            {
                startTime: {
                    $gte: startTime,
                    $lt: endTime
                }
            },
            {
                endTime: {
                    $gt: startTime,
                    $lte: endTime
                }
            }
        ]
    });

    if (cb) {
        return query.exec(cb);
    }
    return query;
};

MeetingSchema.statics.saveComment = function (_id, lastUpdateTime, scope, cb) {

    var query = this.findByIdAndUpdate(_id, {
        $set: {
            scope: scope,
            lastUpdateTime: lastUpdateTime
        }
    });
    if (cb) {
        return query.exec(cb);
    }
    return query;
};

MeetingSchema.statics.findRegularMeetings = function (start_date, end_date, room, department, cb) {

    var conditions = {};
    if (start_date) {
        conditions.startDate = {
            $gte: start_date
        };
    }
    if (end_date) {
        conditions.endDate = {
            $lte: end_date
        };
    }
    if (room) {
        conditions.room = room;
    }
    if (department) {
        conditions.department = department;
    }
    conditions.regular = true;
    var query = this.find(conditions).sort({endDate: 1});
    if (cb) {
        return query.exec(cb);
    }
    return query;
};

MeetingSchema.statics.findMeetingsNotContainRegularMeetingId = function (date, startTime, endTime, room, regularMeetingId, cb) {

    var query = this.find({
        date: {$in: date},
        room: room,
        regularMeetingId: {$ne: regularMeetingId},
        $or: [
            {
                startTime: {
                    $gte: startTime,
                    $lt: endTime
                }
            },
            {
                endTime: {
                    $gt: startTime,
                    $lte: endTime
                }
            }
        ]
    });
    if (cb) {
        return query.exec(cb);
    }
    return query;
};

var EquipmentSchema = new Schema({
    name: String,
    meeting_rooms: [String],
    lastUpdateTime: Date
}, schema_options);

var MeetingRoomSchema = new Schema({
    name: String,
    enabled: Boolean,
    lastUpdateTime: Date
}, schema_options);

MeetingRoomSchema.statics.findEnabled = function (cb) {
    if (cb) {
        return this.find({ enabled: true }).exec(cb);
    }
    return this.find({ enabled: true });
};

var DepartmentSchema = new Schema({
    name: String,
    level: Number,
    lastUpdateTime: Date
}, schema_options);

var PublicNoticeSchema = new Schema({
    content: String,
    lastUpdateTime: Date
}, schema_options);

var UASchema = new Schema({
    ua: String,
    lg: String,
    u: String,
    r: String,
    w: String,
    h: String,
    aw: String,
    ag: String,
    iw: String,
    ih: String,
    ce: String,
    pl: String,
    pd: String,
    je: String,
    ol: String,
    os: String,
    ps: String,
    acn: String,
    an: String,
    av: String,
    mi: String,
    pg: String,
    engine: String,
    browser: String,
    extraBrowser: String,
    mobile: String
}, schema_options);

var Meeting = mongoose.model('Meeting', MeetingSchema);
var Equipment = mongoose.model('Equipment', EquipmentSchema);
var MeetingRoom = mongoose.model('MeetingRoom', MeetingRoomSchema);
var Department = mongoose.model('Department', DepartmentSchema);
var PublicNotice = mongoose.model('PublicNotice', PublicNoticeSchema);
var UA = mongoose.model('UA', UASchema);

function getMeetingRoomsAndDepartments(callback) {
    MeetingRoom.find({enabled: true}).exec(function (err, meeting_rooms) {
        if (err) {
            callback(err);
            return;
        }
        Department.find({}).exec(function (err, departments) {
            if (err) {
                callback(err);
                return;
            }
            callback(null, meeting_rooms, departments);
        });
    });
}

function disconnect() {
    mongoose.disconnect();
}

module.exports.ObjectId = mongoose.Types.ObjectId;
module.exports.Meeting = Meeting;
module.exports.Equipment = Equipment;
module.exports.MeetingRoom = MeetingRoom;
module.exports.Department = Department;
module.exports.PublicNotice = PublicNotice;
module.exports.UA = UA;
module.exports.getMeetingRoomsAndDepartments = getMeetingRoomsAndDepartments;
module.exports.disconnect = disconnect;
