const spider = require("./index.js");
const redisDao = require("./db/redisDao");
const log4js = require("log4js");
const logger = log4js.getLogger();

logger.info("获取全文进程启动");
(async () => {
    let RunEval;
    let target;
    // 每3秒进行一次检测，有则执行
    setInterval(async () => {
        let size = await redisDao.getListDetailLength();
        logger.info("全文获取任务队列剩余长度%s", size);
        if (size) {
            let proxySize = await redisDao.getListProxyLength()
            if (proxySize) {
                target = await redisDao.popListDetail();
                let proxy = await redisDao.popListProxy();
                await redisDao.pushListProxy(proxy);
                try{
                    console.log(target)
                    target = JSON.parse(target);
                    let element = target;
                    
                    // target.forEach(async element => {
                        if (element['RunEval']) {
                            RunEval = element;
                            console.log(RunEval)
                            await spider.getOneWenShuDetail(true, element['RunEval'], proxy);
                        } else {
                            let result = await spider.getOneWenShuDetail(false, element['文书ID'], proxy, RunEval);
                        } 
                    // });
                } catch (e) {
                    // console.log(e);
                    // console.log(target)
                    // console.log(RunEval)
                    if (!target || target == 'undefined') {
                        return;
                    }
                    await redisDao.pushListDetail(RunEval);
                    await redisDao.pushListDetail(target);
                    // await redisDao.pushListDetail(target);
                }
            }
        }
    }, 100);
})();