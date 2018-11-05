const spider = require("./index.js");
const redisDao = require("./db/redisDao");
const log4js = require("log4js");
const logger = log4js.getLogger();

logger.info("获取列表进程启动");
(async () => {
    // 每3秒进行一次检查并且执行
    setInterval(async () => {
        let size = await redisDao.getListTargetLength();
        logger.error(`列表队列剩余大小---->${size}`);
        if (size) {
            let proxySize = await redisDao.getListProxyLength()
            if (proxySize) {
                let target = await redisDao.popListTarget();
                let proxy = await redisDao.popListProxy();
                await redisDao.pushListProxy(proxy);
                try{
                    target = JSON.parse(target);
                    let result = await spider.getOnePageWenShu(target.param, target.page, proxy);
                    if (result) {
                        await redisDao.pushListDetail(result);
                    }
                } catch (e) {
                    await redisDao.pushListTarget(target);
                }
            }
        }
    }, 3000);
})();