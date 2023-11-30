const winston = require('winston');
const fsr = require('file-stream-rotator');
const fs = require("fs")
require("dotenv").config()
const SERVER_DEBUG = process.env.SERVER_DEBUG === 'true'

const customFormat = winston.format.printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        customFormat
    ),
    transports: SERVER_DEBUG ? [
        new winston.transports.Console(),
        createFileTransport('info'),
        createFileTransport('error', 'winston-error.log')
    ] : [
        createFileTransport('info'),
        createFileTransport('error', 'winston-error.log')
    ]
});

function createFileTransport(level, filename = `winston-app.log`) {
    return new winston.transports.File({
        level: level,
        filename: filename,
        dirname: 'logs',
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        tailable: true,
        zippedArchive: true
    });
}

// 如果 logs 目录不存在，创建它
if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
}

module.exports = logger;
