const log4js = require("log4js");
const redisDao = require("./db/redisDao");
const logger = log4js.getLogger();

// 清空原始redis任务队列
redisDao.flushAll()
    .then(res => {
        console.log("清空任务队列成功");
        process.exit(0);
    }).catch(err => {
        console.log("清空任务队列失败, 原因是：");
        console.log(err)
        process.exit(1);
    });