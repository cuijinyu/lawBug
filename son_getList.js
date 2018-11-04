const spider = require("./index.js");
const redisDao = require("./db/redisDao");
const log4js = require("log4js");
const logger = log4js.getLogger();

console.log("获取列表进程启动");
(async () => {
    // 进程阻塞，保证一直可以运行
    while (true) {
        let size = await redisDao.getListTargetLength();
        logger.error(`剩余大小---->${size}`);
        if (size) {
            let proxySize = await redisDao.getListProxyLength()
            if (proxySize) {
                let target = await redisDao.popListTarget();
                let proxy = await redisDao.popListProxy();
                await redisDao.pushListProxy(proxy);
                try{
                    target = JSON.parse(target);
                    let result = await spider.getOnePageWenShu(target.param, target.page);
                    console.log(result);
                } catch (e) {
                    await redisDao.pushListTarget(target);
                }
            }
        }
    }
})();