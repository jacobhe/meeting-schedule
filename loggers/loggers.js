var winston = require('winston');

//
// Configure the logger for `defaultlogger`
//
winston.loggers.add('defaultlogger', {
    console: {
        colorize: 'true'
    },
    file: {
        filename: 'logs/aw-schedule.log',
        timestamp: true,
        maxsize: 1024 * 1024,
        json: false
    }
});

module.exports.defaultlogger = winston.loggers.get('defaultlogger');
