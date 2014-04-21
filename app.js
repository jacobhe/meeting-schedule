/*jslint node: true, vars: true, nomen: true */
'use strict';

var util = require('util');
var fs = require('fs');
var express = require('express');
var routes = require('./routes');
var app = express();
var auth = require('./auth');
var logger = require('./loggers').defaultlogger;
var channel = require('./lib/channel');
var backup = require('./lib/backup');

// redis session store
//var RedisStore = require('connect-redis')(express);
//var sessionStore = new RedisStore();
// mongodb session store
//var MongoStore = require('connect-mongo');
//var mongodbStore = new MongoStore({db: 'gmoa'});

var timezone_offset = 8 * 60 * 60 * 1000;
var aday = 24 * 60 * 60 * 1000;

// Configuration
app.configure(function () {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.use(express.logger({stream: fs.createWriteStream('./logs/express-logs.log', {flag: 'w'})}));
    app.use(express.cookieParser());
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    // memory session store
    app.use(express.session({ secret: 'alice and white meeeting schedule' }));
    // redis session store
    //app.use(express.session({ secret: 'alice & white meeeting schedule', store: sessionStore }));
    // mongodb session store
    //app.use(express.session({ secret: 'alice & white meeeting schedule', store: mongodbStore }));
    app.use(auth.initialize());
    app.use(auth.session());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});

app.configure('development', function () {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function () {
    app.use(express.errorHandler());
});

// Routes
app.get('/', routes.index);

app.all('/admin/:biz/:op?', function (req, res, next) {
    if (req.user) {
        next();
    } else {
        if (req.isXMLHttpRequest) {
            res.json({ error: true, message: '你已经退出登录。' });
        } else {
            res.redirect('/user/login');
        }
    }
});

app.post('/messages/recv', function (req, res) {
    var since = req.param('since');
    var date = req.param('date');
    logger.info(util.format('pulling new meetings: since=%s, date=%s', since, date));
    channel.query(date, since, function (meetings) {
        res.json(meetings);
    });
});

// Tempaltes
app.get('/templates/meeting-dialog.ejs', routes.templates.meetingDialog);
app.get('/templates/regular-meeting-dialog.ejs', routes.templates.regularMeetingDialog);
app.get('/templates/equipment-dialog.ejs', routes.templates.equipmentDialog);
app.get('/templates/select-equipment-dialog.ejs', routes.templates.selectEquipmentDialog);

// User related
app.get('/user/login', function (req, res) {
    res.render('login', { user: req.user, message: '', title: 'Login' });
});

app.post('/user/login', auth.authenticate('local', { failureRedirect: '/user/login'}), function (req, res) {
    res.redirect('/meetings/view');
});

app.get('/user/logout', function (req, res) {
    req.logout();
    res.redirect('/meetings/view');
});

// Meeting Page
app.post('/meetings/insert', routes.meetings.insert);

app.post('/meetings/update', routes.meetings.update);

app.post('/meetings/delete', routes.meetings.remove);

app.get('/meetings/view', routes.meetings.view);

app.post('/meetings/list', routes.meetings.list);

app.get('/meetings/departments', routes.meetings.departments);

app.get('/meetings/public-notices', routes.meetings.publicNotices);

app.post('/meetings/confirm-password', routes.meetings.confirmPassword);

app.post('/meetings/comment', routes.meetings.comment);

app.get('/admin/regular-meetings/list', routes.admin.regular_meetings.list);

app.post('/admin/regular-meetings/insert', routes.admin.regular_meetings.insert);

app.post('/admin/regular-meetings/update', routes.admin.regular_meetings.update);

app.post('/admin/regular-meetings/delete', routes.admin.regular_meetings.remove);

// Public notice
app.get('/admin/public-notices/list', routes.admin.public_notices.list);

app.post('/admin/public-notices/insert', routes.admin.public_notices.insert);

app.post('/admin/public-notices/update', routes.admin.public_notices.update);

app.post('/admin/public-notices/delete', routes.admin.public_notices.remove);

// equipments
app.get('/admin/equipments/list', routes.admin.equipments.list);

app.post('/admin/equipments/insert', routes.admin.equipments.insert);

app.post('/admin/equipments/delete', routes.admin.equipments.remove);

// meeting room
app.get('/admin/meeting-rooms/list', routes.admin.meeting_rooms.list);

app.post('/admin/meeting-rooms/insert', routes.admin.meeting_rooms.insert);

app.post('/admin/meeting-rooms/delete', routes.admin.meeting_rooms.remove);

app.post('/admin/meeting-rooms/change-state', routes.admin.meeting_rooms.changeStatus);

// mobile
app.get('/mobile/list', routes.mobile.list);

app.get('/mobile/view/:uuid', routes.mobile.view);

// data analytics
app.get('/gma.gif', routes.data.saveAnalyticsData);

app.get('/data/countEngines', routes.data.countEngines);

app.get('/data/countBrowsers', routes.data.countBrowsers);

app.listen(3000);
logger.info(util.format("Express server listening on port %d in %s mode", 3000, app.settings.env));

//backup.run();
