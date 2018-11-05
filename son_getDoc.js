const spider = require("./index.js");
const redisDao = require("./db/redisDao");
const log4js = require("log4js");
const logger = log4js.getLogger();

logger.info("获取全文进程启动");
(async () => {
    // 每3秒进行一次检测，有则执行
    setInterval(async () => {
        let size = await redisDao.getListDetailLength();
        logger.info("全文获取任务队列剩余长度%s", size);
        if (size) {
            let proxySize = await redisDao.getListProxyLength()
            if (proxySize) {
                let target = await redisDao.popListDetail();
                let proxy = await redisDao.popListProxy();
                await redisDao.pushListProxy(proxy);
                try{
                    target = JSON.parse(target);
                    target.forEach(async element => {
                        console.log(`------`);
                        console.log(element);
                        console.log(`------`);
                        if (element['RunEval']) {
                            await spider.getOneWenShuDetail(true, element['RunEval'], proxy);
                        } else {
                            let result = await spider.getOneWenShuDetail(false, element['文书ID'], proxy);
                            console.log(result);
                        } 
                    });
                } catch (e) {
                    console.log(e);
                    await redisDao.pushListDetail(target);
                }
            }
        }
    }, 5000);
})();