'use strict';
/*jslint vars: true, nomen: true */
/*global emit */

var mongo = require('mongodb');
var Server = mongo.Server;
var ReplSetServers = mongo.ReplSetServers;
var Db = mongo.Db;
var EventEmitter = require('events').EventEmitter;
var when = require('when');
var servers = [];
var db;
var connecting = false;

function inherit(C, P) {
    var F = function () { };
    F.prototype = P.prototype;
    C.prototype = new F();
    C.uber = P.prototype;
    C.prototype.constructor = C;
}


function MeetingProvider(servers) {
}

inherit(MeetingProvider, EventEmitter);

function getDb() {

    var deferred = when.defer();
    var mongo_servers = [];
    var i;
    var replSet;

    if (db) {
        deferred.resolve(db);
    } else {
        if (connecting) {
            process.nextTick(function () {
                getDb().then(function (db2) {
                    deferred.resolve(db2);
                }, function (err) {
                    deferred.reject(err);
                });
            });
        } else {
            connecting = true;
            for (i = 0; i < servers.length; i += 1) {
	            mongo_servers.push(new Server(servers[i].host, servers[i].port, { auto_reconnect: true }));
            }
            replSet = new ReplSetServers(mongo_servers);

            //db = new Db('gmoa', replSet);
            new Db('gmoa', mongo_servers[0]).open(function (err, pdb) {
                if (err) {
                    deferred.reject(err);
                } else {
                    if (pdb._state !== 'connecting') {
                        db = pdb;
                        connecting = false;
                        deferred.resolve(pdb);
                    }
                }
            });
        }
    }
    return deferred.promise;
}

/*
 * get mettings collection
 */
function getMeetingCollection() {
    var deferred = when.defer();

    getDb().then(function (db) {
        db.collection('meetings', function (err, meeting_collection) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(meeting_collection);
            }
        });
    }, deferred.reject);
    return deferred.promise;
}

//findAll
MeetingProvider.prototype.findAll = function () {
    var deferred = when.defer();
    getMeetingCollection().then(function (meeting_collection) {
        meeting_collection.find().toArray(function (err, meetings) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(meetings);
            }
        });
    }, deferred.reject);
    return deferred.promise;
};

//removeAll
MeetingProvider.prototype.removeAll = function () {
    var deferred = when.defer();
    getMeetingCollection().then(function (meeting_collection) {
        meeting_collection.remove(function (err, numberOfRemovedDocs) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(numberOfRemovedDocs);
            }
        });
    }, deferred.reject);
    return deferred.promise;
};

//findByDate
MeetingProvider.prototype.findByDate = function (date) {
    var deferred = when.defer();
    getMeetingCollection().then(function (meeting_collection) {
        meeting_collection.find({date: date}).toArray(function (err, meetings) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(meetings);
            }
        });
    }, deferred.reject);
    return deferred.promise;
};

MeetingProvider.prototype.findMeetingBetwween = function (date, startTime, endTime, room) {
    var deferred = when.defer();
    getMeetingCollection().then(function (meeting_collection) {
	    meeting_collection.find({
	        date: {$in: date},
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
	    }).toArray(function (err, meetings) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(meetings);
            }
        });
    }, deferred.reject);
    return deferred.promise;
};

MeetingProvider.prototype.findMeetingsNotEqualRegularMeetingUuid = function (date, startTime, endTime, room, regularMeetingUuid) {
    var deferred = when.defer();
    getMeetingCollection().then(function (meeting_collection) {
	    meeting_collection.find({
	        date: {$in: date},
	        room: room,
	        regular_meeting_uuid: {$ne: regularMeetingUuid},
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
	    }).toArray(function (err, meetings) {
            if (err) {
                deferred.reject();
            } else {
                deferred.resolve(meetings);
            }
        });
    }, deferred.reject);
    return deferred.promise;
};

MeetingProvider.prototype.countMeetings = function (room, startTime, endTime, years, months, days, date, uuid) {
    var deferred = when.defer();
    getMeetingCollection().then(function (meeting_collection) {
	    var query = {
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
	        ],
	        years: {$in: years},
	        months: {$in: months},
	        days: {$in: days},
	        date: {$in: date}
	    };
	    if (uuid) {
	        query.uuid = {$neq: uuid};
	    }
	    meeting_collection.count(query, function (err, count) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(count);
            }
        });
    }, deferred.reject);
    return deferred.promise;
};


//findByLastUpdateTime

MeetingProvider.prototype.findByLastUpdateTime = function (since, date) {
    var deferred = when.defer();
    getMeetingCollection().then(function (meeting_collection) {
        meeting_collection.find({
            lastUpdateTime: {
                $gt: since
            },
            date: date
        }).toArray(function (err, meetings) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(meetings);
            }
        });
    }, deferred.reject);
    return deferred.promise;
};

//findByDate
MeetingProvider.prototype.findByUuidAndPassword = function (uuid, password) {
    var deferred = when.defer();
    getMeetingCollection().then(function (meeting_collection) {
        var sample;
        sample = {};
        sample.uuid = uuid;
        sample.password = parseInt(password, 10);
        meeting_collection.find(sample).toArray(function (err, meetings) {
            if (err) {
                deferred.reject();
            } else {
                deferred.resolve(meetings);
            }
        });
    }, deferred.reject);
    return deferred.promise;
};

MeetingProvider.prototype.findMeetingByUuid = function (uuid) {
    var deferred = when.defer();
    getMeetingCollection().then(function (meeting_collection) {
        var sample;
        sample = {};
        sample.uuid = uuid;
        meeting_collection.find(sample).toArray(function (err, meetings) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(meetings);
            }
        });
    }, deferred.reject);
    return deferred.promise;
};

//findById

MeetingProvider.prototype.findById = function (id) {
    var deferred = when.defer();
    getMeetingCollection().then(function (meeting_collection) {
        meeting_collection.findOne({
            _id: meeting_collection.db.bson_serializer.ObjectID.createFromHexString(id)
        }, function (err, meeting) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(meeting);
            }
        });
    }, deferred.reject);
    return deferred.promise;
};

//save
MeetingProvider.prototype.save = function (meetings) {
    var deferred = when.defer();
    getMeetingCollection().then(function (meeting_collection) {
        if (typeof (meetings.length) === "undefined") {
            meetings = [meetings];
	    }
        meeting_collection.insert(meetings, function (err, meeting) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(meeting);
            }
        });
    }, deferred.reject);
    return deferred.promise;
};

MeetingProvider.prototype.update = function (meeting) {
    var deferred = when.defer();
    getMeetingCollection().then(function (meeting_collection) {
        meeting_collection.findAndModify(
            { uuid: meeting.uuid },
            [['_id', 'asc']],
            {
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
            },
            {'new': true},
            function (err) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve();
                }
            }
        );
    }, deferred.reject);
    return deferred.promise;
};

MeetingProvider.prototype.remove = function (uuid) {
    var deferred = when.defer();
    getMeetingCollection().then(function (meeting_collection) {
        meeting_collection.findAndModify(
            {uuid: uuid},
            [['_id', 'asc']],
            {},
            {remove: true},
            function (err) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve();
                }
            }
        );
    });
    return deferred.promise;
};

MeetingProvider.prototype.saveComment = function (meeting) {
    var deferred = when.defer();
    getMeetingCollection().then(function (meeting_collection) {
        meeting_collection.findAndModify(
            { uuid: meeting.uuid },
            [['_id', 'asc']],
            {
                $set: {
                    scope: meeting.scope,
                    lastUpdateTime: meeting.lastUpdateTime
                }
            },
            {'new': true},
            function (err) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve();
                }
            }
        );
    }, deferred.reject);
    return deferred.promise;
};

MeetingProvider.prototype.close = function () {
    this.db.close();
};

function getDepartmentCollection() {
    var deferred = when.defer();
    getDb().then(function (db) {
        db.collection('departments', function (err, department_collection) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(department_collection);
            }
        });
    }, deferred.reject);
    return deferred.promise;
}

//findAll
MeetingProvider.prototype.findAllDepartments = function () {
    var deferred = when.defer();
    getDepartmentCollection().then(function (department_collection) {
        department_collection.find().toArray(function (err, departments) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(departments);
            }
        });
    }, deferred.reject);
    return deferred.promise;
};

//save
MeetingProvider.prototype.saveDepartments = function (departments) {
    var deferred = when.defer();
    getDepartmentCollection().then(function (department_collection) {
        if (typeof (departments.length) === "undefined") {
            departments = [departments];
        }

        department_collection.insert(departments, { safe: true }, function (err, department) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(department);
            }
        });
    }, deferred.reject);
    return deferred.promise;
};

MeetingProvider.prototype.updateDepartment = function (department, callback) {
    var deferred = when.defer();
    getDepartmentCollection().then(function (department_collection) {
        department_collection.findAndModify(
            { uuid: department.uuid },
            [['_id', 'asc']],
            {
                $set: {
                    level: department.level,
                    lastUpdateTime: department.lastUpdateTime
                }
            },
            { 'new': true },
            function (err, department) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(department);
                }
            }
        );
    }, deferred.reject);
    return deferred.promise;
};


function getMessageCollection() {
    var deferred = when.defer();
    getDb().then(function (db) {
        db.collection('messages', function (err, message_collection) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(message_collection);
            }
        });
    }, deferred.reject);
    return deferred.promise;
}

//save
MeetingProvider.prototype.saveMessages = function (messages) {
    var deferred = when.defer();
    getMessageCollection().then(function (message_collection) {
        if (typeof (messages.length) === "undefined") {
            messages = [ messages ];
	    }

        message_collection.insert(messages, { safe: true }, function (err, messages) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(messages);
            }
        });
    }, deferred.reject);
    return deferred.promise;
};

//findAll
MeetingProvider.prototype.findAllRegularMeetings = function () {
    var deferred = when.defer();
    getMeetingCollection().then(function (meeting_collection) {
        var meeting = {};
        meeting.regular = true;
        meeting_collection.find(meeting).toArray(function (err, meetings) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(meetings);
            }
        });
    }, deferred.reject);
    return deferred.promise;
};

MeetingProvider.prototype.findRegularMeetings = function (start_date, end_date, room, department) {
    var deferred = when.defer();
    getMeetingCollection().then(function (meeting_collection) {
        var meeting = {};
        if (start_date) {
            meeting.start_date = {
                $gte: start_date
            };
        }
        if (end_date) {
            meeting.end_date = {
                $lte: end_date
            };
        }
        if (room) {
            meeting.room = room;
        }
        if (department) {
            meeting.department = department;
        }
        meeting.regular = true;
        meeting_collection.find(meeting, {sort: {end_date: 1}}).toArray(function (err, meetings) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(meetings);
            }
        });
    }, deferred.reject);
    return deferred.promise;
};

MeetingProvider.prototype.updateRegularMeetings = function (regular_meetings, callback) {
    var deferred = when.defer();
    getMeetingCollection(function (meeting_collection) {
        meeting_collection.findAndModify(
            { regular_meeting_uuid: regular_meetings.uuid },
            [['_id', 'asc']],
            {
                $set: {
                    title: regular_meetings.title,
                    startTime: regular_meetings.startTime,
                    endTime: regular_meetings.endTime,
                    room: regular_meetings.room,
                    lastUpdateTime: regular_meetings.lastUpdateTime,
                    department: regular_meetings.department,
                    phone: regular_meetings.phone,
                    name: regular_meetings.name
                }
            },
            { 'new': true },
            function (err, meetings) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(meetings);
                }
            }
        );
    }, deferred.reject);
    return deferred.promise;
};

MeetingProvider.prototype.removeRegularMeeting = function (regular_meetings) {
    var deferred = when.defer();
    getMeetingCollection().then(function (meeting_collection) {
        meeting_collection.remove(
            { regular_meeting_uuid: regular_meetings.uuid },
            function (err, meeting) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(meeting);
                }
            }
        );
    }, deferred.reject);
    return deferred.promise;
};

function getPublicNoticesCollection() {
    var deferred = when.defer();
    getDb().then(function (db) {
        db.collection('public_notices', function (err, public_notices_collection) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(public_notices_collection);
            }
        });
    }, deferred.reject);
    return deferred.promise;
}


//findAll
MeetingProvider.prototype.findAllPublicNotice = function () {
    var deferred = when.defer();
    getPublicNoticesCollection().then(function (collection) {
        collection.find().sort({ lastUpdateTime: -1 }).toArray(function (err, public_notices) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(public_notices);
            }
        });
    }, deferred.reject);
    return deferred.promise;
};

//save
MeetingProvider.prototype.savePublicNotice = function (notice) {
    var deferred = when.defer();
    getPublicNoticesCollection().then(function (collection) {
        if (typeof (notice.length) === "undefined") {
			notice = [notice];
		}

        collection.insert(notice, { safe: true }, function (err, public_notice) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(public_notice);
            }
        });
    }, deferred.reject);
    return deferred.promise;
};

MeetingProvider.prototype.updatePublicNotice = function (notice) {
    var deferred = when.defer();
    getPublicNoticesCollection().then(function (collection) {
        collection.findAndModify(
            { uuid: notice.uuid },
            [['_id', 'asc']],
            {
                $set: {
                    content: notice.content,
                    lastUpdateTime: notice.lastUpdateTime
                }
            },
            { 'new': true },
            function (err, public_notice) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(public_notice);
                }
            }
        );
    }, deferred.reject);
    return deferred.promise;
};

MeetingProvider.prototype.removePublicNotice = function (notice) {
    var deferred = when.defer();
    getPublicNoticesCollection().then(function (collection) {
        collection.findAndModify(
            { uuid: notice.uuid },
            [['_id', 'asc']],
            {},
            { remove: true },
            function (err, public_notice) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(public_notice);
                }
            }
        );
    }, deferred.reject);
    return deferred.promise;
};

MeetingProvider.prototype.getEquipmentCollection = function () {
    var deferred = when.defer();
    getDb().then(function (db) {
        db.collection('equipments', function (err, collection) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(collection);
            }
        });
    }, deferred.reject);
    return deferred.promise;
};

//findAll
MeetingProvider.prototype.findAllEquipments = function () {
    var deferred = when.defer();
    this.getEquipmentCollection().then(function (collection) {
        collection.find().toArray(function (err, equipments) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(equipments);
            }
        });
    }, deferred.reject);
    return deferred.promise;
};

//save
MeetingProvider.prototype.saveEquipments = function (equipments) {
    var deferred = when.defer();
    this.getEquipmentCollection().then(function (collection) {
        if (typeof (equipments.length) === "undefined") {
			equipments = [equipments];
	    }

        collection.insert(equipments, { safe: true }, function (err, equipments) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(equipments);
            }
        });
    }, deferred.reject);
    return deferred.promise;
};

MeetingProvider.prototype.updateEquipment = function (equipment, callback) {
    var deferred = when.defer();
    this.getEquipmentCollection().then(function (collection) {
        collection.findAndModify(
            { uuid: equipment.uuid },
            [['_id', 'asc']],
            {
                $set: {
                    amount: equipment.amount,
                    lastUpdateTime: equipment.lastUpdateTime
                }
            },
            { 'new': true },
            function (err, equipment) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(equipment);
                }
            }
        );
    }, deferred.reject);
    return deferred.promise;
};

MeetingProvider.prototype.removeEquipment = function (equipment) {
    var deferred = when.defer();
    this.getEquipmentCollection().then(function (collection) {
        collection.findAndModify(
            { uuid: equipment.uuid },
            [['_id', 'asc']],
            {},
            { remove: true },
            function (err, equipment) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(equipment);
                }
            }
        );
    }, deferred.reject);
    return deferred.promise;
};

MeetingProvider.prototype.getMeetingRoomCollection = function () {
    var deferred = when.defer();
    getDb().then(function (db) {
        db.collection('meeting_rooms', function (err, collection) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(collection);
            }
        });
    }, deferred.reject);
    return deferred.promise;
};

//findAll
MeetingProvider.prototype.findAllMeetingRooms = function () {
    var deferred = when.defer();
    this.getMeetingRoomCollection(function (error, collection) {
        collection.find().toArray(function (err, meeting_rooms) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(meeting_rooms);
            }
        });
    }, deferred.reject);
    return deferred.promise;
};

//save
MeetingProvider.prototype.saveMeetingRooms = function (meetingRooms) {
    var deferred = when.defer();
    this.getMeetingRoomCollection().then(function (collection) {
        if (typeof (meetingRooms.length) === "undefined") {
		    meetingRooms = [meetingRooms];
	    }

        collection.insert(meetingRooms, { safe: true }, function (err, meeting_rooms) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(meeting_rooms);
            }
        });
    }, deferred.reject);
    return deferred.promise;
};

MeetingProvider.prototype.updateMeetingRoom = function (meetingRoom) {
    var deferred = when.defer();
    this.getMeetingRoomCollection().then(function (collection) {
        collection.findAndModify(
            { uuid: meetingRoom.uuid },
            [['_id', 'asc']],
            {
                $set: {
                    name: meetingRoom.name,
                    enabled: meetingRoom.enabled,
                    lastUpdateTime: meetingRoom.lastUpdateTime
                }
            },
            { 'new': true },
            function (err, meeting_room) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(meeting_room);
                }
            }
        );
    }, deferred.reject);
    return deferred.promise;
};

MeetingProvider.prototype.updateMeetingRoomState = function (meetingRoom) {
    var deferred = when.defer();
    this.getMeetingRoomCollection().then(function (collection) {
        collection.findAndModify(
            { uuid: meetingRoom.uuid },
            [['_id', 'asc']],
            {
                $set: {
                    enabled: meetingRoom.enabled,
                    lastUpdateTime: meetingRoom.lastUpdateTime
                }
            },
            { 'new': true },
            function (err, meeting_room) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(meeting_room);
                }
            }
        );
    }, deferred.reject);
    return deferred.promise;
};

MeetingProvider.prototype.removeMeetingRoom = function (meetingRoom) {
    var deferred = when.defer();
    this.getMeetingRoomCollection().then(function (collection) {
        collection.findAndModify(
            { uuid: meetingRoom.uuid },
            [['_id', 'asc']],
            {},
            { remove: true },
            function (err, meeting_room) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(meeting_room);
                }
            }
        );
    }, deferred.reject);
    return deferred.promise;
};

MeetingProvider.prototype.findEquipmentsInUse = function (startTime, endTime, years, months, days, date) {
    var deferred = when.defer();
    this.getMeetingCollection().then(function (collection) {
	    var map = function () {
            var i;
	        for (i = 0; i < this.equipments; i += 1) {
		        emit(this.equipments[i], 1);
	        }
	    };
	    var reduce = function (k, vals) {
            var i;
	        var sum = 0;
            for (i = 0; i < vals.length; i += 1) {
                sum += vals[i];
            }
            return sum;
	    };

	    var query = {
	        $or: [{
		        startTime: {
			        $gte: startTime,
			        $lt: endTime
		        }
		    }, {
		        endTime: {
			        $gt: startTime,
			        $lte: endTime
		        }
		    }],
	        years: {$in: years},
	        months: {$in: months},
	        days: {$in: days},
	        date: {$in: date}
	    };

        collection.mapReduce(
	        map,
	        reduce,
	        {
		        out: { inline: 1 },
		        query: query
	        },
	        function (err, equipments) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(equipments);
                }
            }
	    );
    }, deferred.reject);
    return deferred.promise;
};


exports.MeetingProvider = MeetingProvider;
