const spider = require("./index.js");
const redisDao = require("./db/redisDao");
const log4js = require("log4js");
const logger = log4js.getLogger();

console.log("获取全文进程启动");