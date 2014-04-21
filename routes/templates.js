/*jslint node: true, vars: true, nomen: true */
'use strict';

var Models = require('../models');
var Equipment = Models.Equipment;
var Department = Models.Department;
var MeetingRoom = Models.MeetingRoom;

// Tempaltes
function meetingDialog(req, res) {

    Models.getMeetingRoomsAndDepartments(function (err, meeting_rooms, departments) {
        if (err) {
            res.json({error: true});
            return;
        }
        res.render('meeting-dialog', { layout: false, meeting_rooms: meeting_rooms, departments: departments});
    });
}

function regularMeetingDialog(req, res) {

    Models.getMeetingRoomsAndDepartments(function (err, meeting_rooms, departments) {
        if (err) {
            res.json({error: true});
            return;
        }

        var options = {
            layout: false,
            meeting_rooms: meeting_rooms,
            departments: departments
        };
        res.render('regular-meeting-dialog', options);
    });
}

function equipmentDialog(req, res) {

    MeetingRoom.find({enabled: true}).exec(function (err, meeting_rooms) {
        if (err) {
            res.json({err: true});
            return;
        }
        res.render('equipment-dialog', { layout: false, meeting_rooms: meeting_rooms });
    });
}

function selectEquipmentDialog(req, res) {

    Equipment.find().exec(function (err, equipments) {
        if (err) {
            res.json({err: true});
            return;
        }

        res.render('select-equipment-dialog', { layout: false, equipments: equipments });
    });
}

module.exports.meetingDialog = meetingDialog;
module.exports.regularMeetingDialog = regularMeetingDialog;
module.exports.equipmentDialog = equipmentDialog;
module.exports.selectEquipmentDialog = selectEquipmentDialog;
