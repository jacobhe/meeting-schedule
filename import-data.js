var path = require('path');
var fs = require('fs');
var nconf = require('nconf');
nconf.file({ file: path.resolve(__dirname, 'awschedule.json') });
var MeetingProvider = require('./dao').MeetingProvider;
var mp = new MeetingProvider(nconf.get('replSet'));
var uuid = require('node-uuid');
var dateutil = require('dateutil');
var timezone_offset = 8 * 60 * 60 * 1000;
var aday = 24 * 60 * 60 * 1000;
var linestream = require('linestream');

mp.on('ready', function (mp) {
    importMeetings();
});

function impotDepartments() {

}

function importMeetingRooms() {

}

function importMeetings() {

    var stream = linestream.create(path.resolve(__dirname, 'exported-data/exported_meetins.txt'));
    var meeting;

    stream.on('data', function (line, isEnd) {
        if (line) {
            meeting = JSON.parse(line);
            mp.save(meeting);
        }
    })

    stream.on('end', function () { // emitted at the end of file
        process.exit();
    });

    stream.on('error', function (e) { // emitted when an error occurred
        process.exit(1);
    });
}
