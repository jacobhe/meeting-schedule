var io = require('socket.io').listen(app);

io.configure(function () {
    io.set('transports', ['websocket', 'flashsocket', 'xhr-polling']);
});

io.configure('development', function () {
    io.set('transports', ['websocket', 'flashsocket', 'xhr-polling']);
    io.enable('log');
});

io.of('/chat').on('connection', function (socket) {
    socket.on('set nickname', function (name) {
        socket.set('nickname', name, function () { socket.emit('ready'); });
    });

    socket.on('msg', function (msg) {
        socket.get('nickname', function (err, name) {
            logger.info(util.format('Chat message by %s %s', name, msg));
        });
    });
});

var socketsRegistry = {};

// notify all sockets except the one in exclude
    //var dateSockets = socketsRegistry[date];
    //var p;
    //if (dateSockets) {
    //    for (p in dateSockets) {
    //        if (p != exclude) {
    //            dateSockets[p].emit(type, message);
    //        }
    //    }
    //}
    
io.of('/schedule').on('connection', function (socket) {
    var current_date = dateutil.format(new Date(dateutil.now() + timezone_offset), 'Y-m-d');
    var dateSockets = socketsRegistry[current_date];
    var timestamp = new Date().getTime();
    if (!dateSockets) {
        dateSockets = {};
        socketsRegistry[current_date] = dateSockets;
    }
    dateSockets[timestamp] = socket;

    mp.findByDate(current_date, function (err, results) {
        var i;
        if (err) {
            logger.info('err:', err);
            socket.emit('init-meeting', { 'error': true });
        }
        else {
            for (i = 0; i < results.length; i++) {
                socket.emit('init-meeting', results[i]);
            }
        }
    });

    socket.on('add-meeting', function (meeting) {
        logger.info('add meeting:', meeting);
        //mongologger.info('add meeting:', meeting);
        meeting = JSON.parse(meeting);
        meeting.uuid = uuid.v4();
        //meeting.date = dateutil.format(new Date(dateutil.now() + timezone_offset), 'Y-m-d');
        meeting.lastUpdateTime = new Date().getTime();
        mp.save(meeting, function (err, results) {
            if (err) {
                socket.emit('new-meeting', { 'error': true });
            }
            else {
                socket.emit('new-meeting', results[0]);
                //socket.broadcast.emit('new-meeting', results[0]);
                broadcast(current_date, timestamp, 'new-meeting', results[0]);
            }
        });
    });

    socket.on('update-meeting', function (meeting) {
        logger.info('update meeting: ', meeting);
        //mongologger.info('update meeting: ', meeting);
        meeting = JSON.parse(meeting);
        meeting.lastUpdateTime = new Date().getTime();
        mp.update(meeting, function (err, result) {
            if (err) {
                socket.emit('update-meeting', { 'error': true });
            }
            else {
                socket.emit('update-meeting', result);
                //socket.broadcast.emit('update-meeting', result);
                broadcast(current_date, timestamp, 'update-meeting', result);
            }
        });
    });

    socket.on('delete-meeting', function (data) {
        logger.info('delete meeting: ', data);
        //mongologger.info('delete meeting: ', data);
        data = JSON.parse(data);
        mp.remove(data.uuid, function (err, results) {
            if (err) {
                socket.emit('delete-meeting', { 'error': true });
            }
            else {
                //socket.broadcast.emit('delete-meeting', data);
                socket.emit('delete-meeting', data);
                broadcast(current_date, timestamp, 'delete-meeting', data);
            }
        });

    });

    socket.on('resize-meeting', function (data) {
        logger.info('resize meeting: ', data);
        data = JSON.parse(data);
        //socket.broadcast.emit('resize-meeting', data);
        broadcast(current_date, timestamp, 'resize-meeting', data);
    });
    socket.on('move-meeting', function (data) {
        logger.info('move meeting: ', data);
        data = JSON.parse(data);
        //socket.broadcast.emit('move-meeting', data);
        broadcast(current_date, timestamp, 'move-meeting', data);
    });
    socket.on('change-room', function (data) {
        logger.info('change room: ', data);
        var meeting;
        data = JSON.parse(data);
        if (meeting) {
            meeting.room = data.room;
        }
        //socket.broadcast.emit('change-room', data);
        broadcast(current_date, timestamp, 'change-room', data);
    });

    socket.on('change-date', function (date) {
        logger.info('change date: ', date);
        mp.findByDate(date, function (err, results) {
            var i;
            if (err) {
                logger.info('err:', err);
                socket.emit('change-date', { 'error': true });
            }
            else {
                socket.emit('change-date', { 'error': false });
                delete dateSockets[timestamp];
                current_date = date;
                dateSockets = socketsRegistry[current_date];
                if (!dateSockets) {
                    dateSockets = {};
                    socketsRegistry[current_date] = dateSockets;
                }
                dateSockets[timestamp] = socket;
                for (i = 0; i < results.length; i++) {
                    socket.emit('init-meeting', results[i]);
                }
            }
        });
    });

    socket.on('disconnect', function () {
        delete dateSockets[timestamp];
    });
});
