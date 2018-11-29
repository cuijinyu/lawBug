const child_process = require("child_process");
const fs = require("fs");
const spider = require("./index.js");
const Dao = require('./db/dao');
const redisDao = require("./db/redisDao");
const numCPUs = require('os').cpus().length;
const ProxyPool = require("./proxyPool/proxyPool");
const log4js = require("log4js");
const logger = log4js.getLogger();
let proxyPool;

/**
 * 读取全国除去港澳台之外的所有省份列表
 * @param {*} txt 
 */
function readProvinces(txt) {
  txt = txt.split(',');
  return txt;
}

(async () => {
	let baseParam = "法院层级:基层法院,案件类型:刑事案件,审判程序:一审";
	let tempParams = [];
  // 参数队列
  let params = [];

  let provincesData = fs.readFileSync("./data/provinces.txt", "utf8");

  let locations = readProvinces(provincesData);

  locations.forEach(e => {
		tempParams.push(baseParam + ",法院地域:" + e);
		// params.push(baseParam + ",法院地域:" + e);
  })

  // 给每个param按照时间构建条件
  for (let i = 0; i < 4; i ++) {
    for (let j = 1; j <= 12; j ++) {
      for (let x = 1; x <= 31; x ++) {
				// 此处二月没有考虑闰年
        if (j == 2 && x >= 28) {
          break;
        } else if (j == 2 ||
                   j == 4 ||
                   j == 6 ||
                   j == 9 ||
                   j == 11) {
          if (x == 31)
            break;
        } else {
					for (let y = 0; y < tempParams.length; y++) {
						params.push(tempParams[y] + `,裁判日期:${2015 + i}-${(12 - j)>=10?(12 - j):'0'+(12 - j)}-${x>=10?x:'0'+x} TO ${2015 + i}-${(12 - j)>=10?(12 - j):'0'+(12 - j)}-${x>=10?x:'0'+x}`);
					}
        }
      }
    }
  }

  console.log(params.length);
  
  // 文书详情队列
  let detailTargets = [];
  
  try {
    // 初始化任务队列
    for (let i = 0; i < params.length; i++) {
      for (let j = 1; j < 10; j++) {
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

    //  获取所有的文书列表
    let wenshuList = await Dao.getWenShuList();
    wenshuList.forEach(async element => {
      if (element.run_eval) {
          element.RunEval = element.run_eval;
      } 
      element["文书ID"] = element.ID;
      // console.log(JSON.stringify(element));
      await redisDao.pushListDetail(element);
    });
    logger.debug(`文书列表总任务长度为:${await redisDao.getListDetailLength()}`)

    // 15s后执行，给代理池一个构建的时间
    setTimeout(function() {
      let child_process_array = [];
      // for (let i = 0; i < 4; i++) {
      //   child_process_array[i] = child_process.fork("./son_getList.js");
      //   child_process_array[i].on('close', code => {
      //     logger.error("获取列表进程意外退出，错误代码%s", code);
      //   })
      // }
      child_getDoc = child_process.fork("./son_getDoc.js");
      child_getDoc.on('close', code => {
        logger.error("获取全文进程意外退出，错误代码%s", code);
      })
    }, 15000);

    // 每一个小时保存一次redis状态，用于持久化，防止意外关闭时不能再次继续上次的状态
    setTimeout(async() => {
      await redisDao.saveRedis();
    }, 60*60*1000);

  } catch (e) {
    logger.error(e);
  }
})();