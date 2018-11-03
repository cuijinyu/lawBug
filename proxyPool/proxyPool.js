const schedule = require("node-schedule");
const log4js = require("log4js");
const config = require('../config/config');
const request = require('request').defaults({jar: true});
const logger = log4js.getLogger();

function getProxy () {
    let options = {
        url:`${config.proxy.address}`,
        method:"GET",
        timeout:10000,
    };
    return new Promise( (resolve, reject) => {
        //  代理IP
        request(options, (err, res, body) => {
            if (err) {
                logger.error("抱歉！代理服务器似乎挂了");
                reject(err);
            }
            // logger.debug(`<!使用IP代理-------->${body}`);
            resolve(body);
        })
    })
}
// proxyPool 代理池，用来维护一个可用代理池
class ProxyPool {
    constructor () {
      this.proxies = [];   
      this.maintain();
    }

    // 从代理池中获取一个IP代理
    getProxy () {
        let proxy = this.proxies.shift();
        this.proxies.push(proxy);
        return proxy;
    }

    // 获取代理池大小
    get size () {
        return this.proxies.length;
    }

    // 定时维护代理池
    maintain () {
        // 每5秒钟获取一个新的代理
        schedule.scheduleJob("*/5  *  *  *  *  *", async () => {
            try {
                let proxy = await getProxy();
                let flag = true;
                for (let i = 0; i < this.proxies.length; i++) {
                    if (proxy === this.proxies[i]) {
                        flag = false;
                    }
                }
                if (flag) {
                    logger.debug(`${proxy} 加入代理队列`);
                    this.proxies.unshift(proxy);
                }
            } catch(e) {
                
            }
        })
        // 每半小时清空一回代理池
        schedule.scheduleJob("*  */30  *  *  *  *", async () => {
            try {
                let proxy = this.proxies.shift();
                this.proxies = [proxy];
            } catch(e) {
                
            }
        })
    }
}

module.exports = ProxyPool;