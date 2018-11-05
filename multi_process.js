const child_process = require("child_process");
const spider = require("./index.js");
const redisDao = require("./db/redisDao");
const numCPUs = require('os').cpus().length;
const ProxyPool = require("./proxyPool/proxyPool");
const log4js = require("log4js");
const logger = log4js.getLogger();
let proxyPool;
(async () => {
  // 参数队列
  let params = ["全文检索:医疗损害责任纠纷"];
  
  // 文书详情队列
  let detailTargets = [];

  // 清空原始redis任务队列
  await redisDao.flushAll();
  logger.info("清空原始redis队列成功");
  
  try {
    // 初始化任务队列
    for (let i = 0; i < params.length; i++) {
      for (let j = 0; j < 20; j++) {
        await redisDao.pushListTarget({
          param:params[i],
          page:j
        })
      }
    }
    logger.info("任务队列初始化完毕");
    proxyPool = new ProxyPool();
    spider.setProxyPool(proxyPool);
    logger.info("代理池构建完毕");

    // 15s后执行，给代理池一个构建的时间
    setTimeout(function() {
      let child_process_array = [];
      for (let i = 0; i < 2; i++) {
        child_process_array[i] = child_process.fork("./son_getList.js");
        child_process_array[i].on('close', code => {
          logger.error("获取列表进程意外退出，错误代码%s", code);
        })
      }
      child_getDoc = child_process.fork("./son_getDoc.js");
      child_getDoc.on('close', code => {
        logger.error("获取全文进程意外退出，错误代码%s", code);
      })
    }, 15000);

  } catch (e) {
    logger.error(e);
  }
})();