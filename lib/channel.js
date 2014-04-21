/*jslint node: true, vars: true, nomen: true */
'use strict';

var ChannelReginstry = {};
var MESSAGE_BACKLOG = 200;

function Channel(date) {
    var messages = [];
    var callbacks = [];

    this.date = date;

    this.broadcast = function (message) {
        message.timestamp = new Date().getTime();
        messages.push(message);
        while (callbacks.length > 0) {
            callbacks.shift().callback([message]);
        }
        while (messages.length > MESSAGE_BACKLOG) {
            messages.shift();
        }
    };
    this.query = function (since, callback) {
        var matching = [];
        var i;
        for (i = 0; i < messages.length; i += 1) {
            var message = messages[i];
            if (message.timestamp > since) {
                matching.push(message);
            }
        }

        if (matching.length !== 0) {
            callback(matching);
        } else {
            callbacks.push({ timestamp: new Date(), callback: callback });
        }
    };

    // clear old callbacks
    // they can hang around for at most 30 seconds.
    setInterval(function () {
        var now = new Date();
        while (callbacks.length > 0 && now - callbacks[0].timestamp > 30 * 1000) {
            callbacks.shift().callback([]);
        }
    }, 3000);
}

function broadcast(date, message) {

    // notify all longpull clients
    var channel = ChannelReginstry[date];
    if (!channel) {
        channel = ChannelReginstry[date] = new Channel(date);
    }
    channel.broadcast(message);
}

function query(date, since, callback) {

    if (!ChannelReginstry[date]) {
        ChannelReginstry[date] = new Channel(date);
    }
    ChannelReginstry[date].query(since, callback);
}

module.exports.broadcast = broadcast;
module.exports.query = query;
