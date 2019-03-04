function addLog(log) {
    log.timestamp = Date.now();
    log.time = (new Date(log.timestamp)).toLocaleString();
    console[log.level](`[${log.title}]:${log.message} -- ${(new Date(log.timestamp)).toLocaleString()}`, log.data || '');
}

const innerLog = {
    info: (title, message, data) => { addLog({ level: 'info', title, message, data }); },
    debug: (title, message, data) => { addLog({ level: 'info', title, message, data }); },
    warn: (title, message, data) => { addLog({ level: 'warn', title, message, data }); },
    error: (title, message, error) => { addLog({ level: 'error', title, message, data: error }); },
};

export default innerLog;