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

mp.on('ready', function (mp) {
    exportMeetings();
});

function exportDepartments() {
    
}

function exportMeetingRooms() {
    
}

function exportMeetings() {
    mp.findAll(function (err, meetings) {
        var meeting;
        if (err) {
            console.log(err);
            return;
        }
        var rs = fs.createWriteStream(path.resolve(__dirname, 'exported-data/exported_meetins.txt'), { encoding: 'utf8' });
        rs.on('close', function () {
            process.exit();
        });
        for (var i = 0; i < meetings.length; i += 1) {
            meeting = meetings[i];
            delete meeting._id;
            rs.write(JSON.stringify(meeting));
            rs.write('\n');
        }
        rs.end();
    });
}
