var path = require('path');
var fs = require('fs');
var spawn = require('child_process').spawn;
var nconf = require('nconf');
nconf.file({ file: path.resolve(__dirname, 'awschedule.json') });
var MeetingProvider = require('./dao').MeetingProvider;
var mp = new MeetingProvider(nconf.get('replSet'));
var moment = require('moment');
var today = moment(new Date()).format('YYYY-MM-DD');
                   
mp.on('ready', function (mp) {
    backup();
});


function backup() {
    mp.findAll(function (err, meetings) {
        var meeting;
        if (err) {
            console.log(err);
            return;
        }
        var rs = fs.createWriteStream(path.resolve(__dirname, 'backup/backup-' + today + '.txt'), { encoding: 'utf8' });
        rs.on('close', function () {
            compress();
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

function compress() {
    var child = spawn('tar', ['-zcf', 'backup/backup-' + today + '.tar.gz', 'backup/backup-' + today + '.txt']);

    child.on('exit', function (code) {
        fs.unlinkSync('backup/backup-' + today + '.txt');
        process.exit(code);
    });
}
