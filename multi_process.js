const child_process = require("child_process");
const spider = require("./index.js");
const redisDao = require("./db/redisDao");
const numCPUs = require('os').cpus().length;
const ProxyPool = require("./proxyPool/proxyPool");
let proxyPool;
(async () => {
  // 参数队列
  let params = ["全文检索:医疗损害责任纠纷"];
  
  // 文书详情队列
  let detailTargets = [];
  
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
    console.log("任务队列初始化完毕");
    proxyPool = new ProxyPool();
    spider.setProxyPool(proxyPool);
    console.log("代理池构建完毕");

    // 15s后执行，给代理池一个构建的时间
    setTimeout(function() {
      for (let i = 0; i < numCPUs; i++) {
        child_process.fork("./son_getDoc.js");
        child_process.fork("./son_getList.js");
      }
    }, 15000);

  } catch (e) {
    console.log(e);
    
  }
})();