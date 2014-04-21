/*jslint node: true, vars: true, nomen: true */
'use strict';

var Models = require('./models');
var Department = Models.Department;
var MeetingRoom = Models.MeetingRoom;

function initDepartments(callback) {
    var departments = [];
    var lastUpdateTime = new Date();
    departments.push({ name: 'Cs support hk', lastUpdateTime: lastUpdateTime, level: 0 });
    departments.push({ name: 'It', lastUpdateTime: lastUpdateTime, level: 0 });
    departments.push({ name: 'M2c', lastUpdateTime: lastUpdateTime, level: 0 });
    departments.push({ name: '财务', lastUpdateTime: lastUpdateTime, level: 0 });
    departments.push({ name: 'Tele sales support hk', lastUpdateTime: lastUpdateTime, level: 0 });
    departments.push({ name: '公关部', lastUpdateTime: lastUpdateTime, level: 0 });
    departments.push({ name: '国际市场部', lastUpdateTime: lastUpdateTime, level: 0 });
    departments.push({ name: '国际营销服务部', lastUpdateTime: lastUpdateTime, level: 0 });
    departments.push({ name: '客户服务部（设计部&GMC）', lastUpdateTime: lastUpdateTime, level: 0 });
    departments.push({ name: '事业部', lastUpdateTime: lastUpdateTime, level: 0 });
    departments.push({ name: '人力资源部', lastUpdateTime: lastUpdateTime, level: 0 });
    departments.push({ name: '市场部', lastUpdateTime: lastUpdateTime, level: 0 });
    departments.push({ name: '网络营销部', lastUpdateTime: lastUpdateTime, level: 0 });
    departments.push({ name: '物流部', lastUpdateTime: lastUpdateTime, level: 0 });
    departments.push({ name: '销售支持部', lastUpdateTime: lastUpdateTime, level: 0 });
    departments.push({ name: '战略合作部', lastUpdateTime: lastUpdateTime, level: 0 });
    departments.push({ name: '营销部', lastUpdateTime: lastUpdateTime, level: 0 });

    Department.create(departments, callback);
}

function initMeetingRooms(callback) {
    var meeting_rooms = [];
    var lastUpdateTime = new Date();
    meeting_rooms.push({ name: 'Meeting Room1', lastUpdateTime: lastUpdateTime, enabled: true });
    meeting_rooms.push({ name: 'Meeting Room2', lastUpdateTime: lastUpdateTime, enabled: true });
    meeting_rooms.push({ name: 'Meeting Room3', lastUpdateTime: lastUpdateTime, enabled: true });
    meeting_rooms.push({ name: 'Meeting Room4', lastUpdateTime: lastUpdateTime, enabled: true });
    meeting_rooms.push({ name: 'Meeting Room5', lastUpdateTime: lastUpdateTime, enabled: true });
    meeting_rooms.push({ name: 'Meeting Room6', lastUpdateTime: lastUpdateTime, enabled: true });
    meeting_rooms.push({ name: '19F大', lastUpdateTime: lastUpdateTime, enabled: true });
    meeting_rooms.push({ name: '19F小', lastUpdateTime: lastUpdateTime, enabled: true });
    meeting_rooms.push({ name: '17F休闲室', lastUpdateTime: lastUpdateTime, enabled: true });
    meeting_rooms.push({ name: '19F休闲室', lastUpdateTime: lastUpdateTime, enabled: true });

    MeetingRoom.create(meeting_rooms, callback);
}

var action_count = 0;
initDepartments(function (err, results) {
    if (err) {
        console.log(err);
    } else {
        console.log(results);
    }
    action_count += 1;
});
initMeetingRooms(function (err, results) {
    if (err) {
        console.log(err);
    } else {
        console.log(results);
    }
    action_count += 1;
});

var i = setInterval(function () {
    if (action_count === 2) {
        Models.disconnect();
        clearInterval(i);
    }
}, 100);