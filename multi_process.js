const cluster = require("cluster");
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
    let test = await redisDao.popListTarget();
    console.log(test);
    if (test) {
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
    }
    await redisDao.pushListTarget(test);

    if (cluster.isMaster) {
      console.log(`Master ${process.pid} is running`);

      // Fork workers.
      setTimeout(() => {
        for (let i = 0; i < numCPUs; i++) {
          cluster.fork();
        }
      }, 5000);

      cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);
      });
    } else {
        while (true) {
          try {
            let target = await redisDao.popListTarget();
            if (target) {
              temp = JSON.parse(target);
              try {
                await spider.getOnePageWenShu(temp.param, temp.page);
                tempRes.forEach(element => {
                  detailTargets.push(element);
                });
              } catch (e) {
                redisDao.pushListTarget(temp);
              }
            }
          } catch (e) {
            console.log("似乎出错了");
          }
        }
        // while (targets.length) {
        //   let temp;
        //   try {
        //     temp = targets.shift();
        //     let tempRes = await spider.getOnePageWenShu(temp.param, temp.page);
        //     tempRes.forEach(element => {
        //       detailTargets.push(element);
        //     });
        //   } catch (e) {
        //     targets.push(temp);
        //   }
        // }
    }

  } catch (e) {
    console.log(e);
    
  }
})();