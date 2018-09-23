'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
function addLog(log) {
    log.timestamp = Date.now();
    log.time = new Date(log.timestamp).toLocaleString();
    console[log.level]('[' + log.title + ']:' + log.message + ' -- ' + new Date(log.timestamp).toLocaleString(), log.data);
}

var innerLog = {
    info: function info(title, message, data) {
        addLog({ level: 'info', title: title, message: message, data: data });
    },
    debug: function debug(title, message, data) {
        addLog({ level: 'info', title: title, message: message, data: data });
    },
    warn: function warn(title, message, data) {
        addLog({ level: 'warn', title: title, message: message, data: data });
    },
    error: function error(title, message, _error) {
        addLog({ level: 'error', title: title, message: message, data: _error });
    }
};

exports.default = innerLog;