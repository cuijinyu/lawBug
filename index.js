const request = require('request').defaults({jar: true});   //  使用全局cookie
const fs = require('fs');
const qs = require('qs');
const Dao = require('./db/dao');
const De = require('./lib/de');
const config = require('./config/config');
const getKey = require('./lib/getKey');
const log4js = require("log4js");
const Util = require("./util/getInfo");
const ProxyPool = require("./proxyPool/proxyPool");
const unzip = De.unzip;
const redisDao = require("./db/redisDao");
const logger = log4js.getLogger();
// logger.level = 'debug';

// 因为setTimeout被占用，故用setInterval来实现延时
const sleep = (time, cb) => new Promise(resolve => {
    let interval = setInterval(() => {
      clearInterval(interval);
      if (cb)
      cb();
      resolve();
    }, time)
});

let com = {
    str:De.str
}

let proxyPool;

let courtsData = fs.readFileSync('./data/courts.txt', 'utf-8'); //  全国法院数组
courtsData = eval(courtsData);

function getCookie () {
    return new Promise( (resolve, reject) => {
        let headers = {
            "Accept":"*/*",
            "Accept-Encoding":"gzip, deflate",
            "Accept-Language":"zh-CN,zh;q=0.8",
            "Content-Type":"application/x-www-form-urlencoded; charset=UTF-8",
            "Host":"wenshu.court.gov.cn",
            "Origin":"http://wenshu.court.gov.cn",
            "Proxy-Connection":"keep-alive",
            "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.101 Safari/537.36",
            "X-Requested-With":"XMLHttpRequest"
        }
        let options = {
            url:"http://wenshu.court.gov.cn/list/list/?sorttype=1",
            method:"GET",
            headers,
            timeout:10000
        }
        try {
            request.get(options, (err, res, body) => {
                if (err) {
                    logger.error(err);
                    // logger.debug(err);
                    reject(err);
                }
                // logger.debug(res.headers["set-cookie"]);
                try {
                    resolve(res.headers["set-cookie"]);
                } catch (e) {
                    logger.error(e);
                    reject("获取cookie失败");
                }
            })  
        } catch (e) {
            logger.error("获取页面失败")
        }
    })
}

function getvjkl5 (cookie) {
    let vjkl5 = cookie[0].split(";")[0];
    vjkl5 = vjkl5.substr(6, vjkl5.length - 6);
    return vjkl5;
}

function createGuid() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

function get_key (vjkl5) {
    return getKey(vjkl5);
}

function getNumber (guid, proxy) {
    let headers = {
        "Accept":"*/*",
        "Accept-Encoding":"gzip, deflate",
        "Accept-Language":"zh-CN,zh;q=0.8",
        "Content-Type":"application/x-www-form-urlencoded; charset=UTF-8",
        "Host":"wenshu.court.gov.cn",
        "Origin":"http://wenshu.court.gov.cn",
        "Proxy-Connection":"keep-alive",
        "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.101 Safari/537.36",
        "X-Requested-With":"XMLHttpRequest"
    }
    let options = {
        url:"http://wenshu.court.gov.cn/ValiCode/GetCode",
        method:"POST",
        headers,
        body:qs.stringify({
            'guid':guid
        })
    }
    if (proxy) {
        options.proxy = "http://" + proxy;
    }
    return new Promise ((resolve, reject) => {
        request(options, (err, res, body) => {
            if (err) {
                reject(err);
            }
            resolve(body);
        })
    })
}

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
            logger.debug(`<!使用IP代理-------->${body}`);
            // logger.debug(`<!使用IP代理-------->${body}`);
            resolve(body);
        })
    })
    // console.log(proxyPool.getProxy())
    // return Promise.resolve(proxyPool.getProxy());
}

function setProxyPool(pool) {
    proxyPool = pool;
}

function getDoc (realId, proxy) {
    return new Promise ((resolve, reject) => {
        (async () => {
            if (!proxy) {
                proxy = await getProxy();
                if (!proxy){
                    logger.error("获取代理失败");
                    reject();
                }
            }
            let options = {
                url:`http://wenshu.court.gov.cn/CreateContentJS/CreateContentJS.aspx?DocID=${realId}`,
                method:"GET",
                proxy:"http://" + proxy,
                timeout:10000,
            }
            request(options, (err, res, body) => {
                try {
                    if (err) {
                        logger.error(err);
                        reject(err);
                    }
                } catch (e) {
                    logger.warn(e)
                }
                resolve(body);
            })
        })()
    })
}

function getGuid () {
    return createGuid() + createGuid() + '-' + createGuid() + '-' + createGuid() + createGuid() + '-' + createGuid() + createGuid() + createGuid();
}

async function getTreeList (guid, number, param, vl5x, index = 1, proxy) {
    logger.debug(arguments);
    return new Promise ((resolve, reject) => {
        let headers = {
            "Accept":"*/*",
            "Accept-Encoding":"gzip, deflate",
            "Accept-Language":"zh-CN,zh;q=0.8",
            "Content-Type":"application/x-www-form-urlencoded; charset=UTF-8",
            "Host":"wenshu.court.gov.cn",
            "Origin":"http://wenshu.court.gov.cn",
            "Proxy-Connection":"keep-alive",
            "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.101 Safari/537.36",
            "X-Requested-With":"XMLHttpRequest",
            "Connection": "keep-alive",
        }
        number = number.substr(0, 4);
        let options = {
            url:"http://wenshu.court.gov.cn/List/ListContent",
            method:"POST",
            headers,
            timeout:10000,
            body:qs.stringify({
                guid:guid,
                number:number,
                vl5x:vl5x,
                Param:param,
                Index:index,
                Page:20,
                Order:"法院层级",
                Direction:"asc"
            })
        }
        if (config.proxy.address) {
            (async ()=> {
                logger.error(proxy);
                if (!proxy) {
                    proxy = await getProxy();
                    if (!proxy){
                        logger.error("获取代理失败");
                        reject();
                    }
                } else {
                    logger.error("正在使用外部IP代理");
                }
                options['proxy'] = "http://" + proxy;
                let flag = false;
                let timeWatcher = setTimeout(() => {
                    if (!flag) {
                        return;
                    }
                }, 10000);
                try {
                    request(options, (err, res, body) => {
                        if (err) {
                            logger.debug(err);
                            clearTimeout(timeWatcher);
                            reject(err);
                        }
                        logger.debug(body);
                        clearTimeout(timeWatcher);
                        resolve(body);
                    })
                } catch (e) {
                    logger.error("获取超时，正在进行重试");
                    getTreeList(guid, number, param, vl5x, index);
                }
            })()
        } else {
            try {
                request(options, (err, res, body) => {
                    if (err) {
                        console.lot(err);
                        reject(err);
                    }
                    resolve(body);
                })
            } catch (e) {
                logger.error("获取超时，正在进行重试");
                getTreeList(guid, number, param, vl5x, index);
            }
        }
    }).catch(e => {
        logger.debug("获取超时")
    })
}

function Navi (id) {
    let unzipid = unzip(id);
    return com.str.De(unzipid);
}

async function setAllParams () {
    let cookie = await getCookie();
    let vjkl5 = getvjkl5(cookie);
    let guid = getGuid();
    let number = await getNumber(guid);
    let vl5x = get_key(vjkl5);
    logger.debug(`设置Cookie为 -----> ${cookie}`);
    logger.debug(`设置vjkl5为 -----> ${vjkl5}`);
    logger.debug(`设置number为 -----> ${number}`);
    logger.debug(`设置vl5x为 -----> ${vl5x}`);
    //查询所用的参数
    let param = `${config.search.param}`;
    logger.debug(`设置查询参数为 -----> ${config.search.param}`);
    return {
        cookie,
        vjkl5,
        guid,
        number,
        vl5x,
        param
    }
}

async function setAllParams_multi (param, proxy) {
    let cookie = await getCookie();
    let vjkl5 = getvjkl5(cookie);
    let guid = getGuid();
    let number = await getNumber(guid, proxy);
    let vl5x = get_key(vjkl5);
    logger.debug(`设置Cookie为 -----> ${cookie}`);
    logger.debug(`设置vjkl5为 -----> ${vjkl5}`);
    logger.debug(`设置number为 -----> ${number}`);
    logger.debug(`设置vl5x为 -----> ${vl5x}`);
    //查询所用的参数
    logger.debug(`设置查询参数为 -----> ${param}`);
    return {
        cookie,
        vjkl5,
        guid,
        number,
        vl5x,
        param
    }
}

async function main () {
    let contentList = [];
    let searchObj = {};
    let result;
    logger.debug(`----------------------------------------> 开始获取列表`);
    proxyPool = new ProxyPool();
    // for (let i = 0; i < courtsData.length; i ++) {
    //     logger.debug("");
    //     logger.debug(`<<正在查询 <${courtsData[i]}> 法院的数据>>`);
    //     logger.debug(`获取法院数据进度：${i / courtsData.length * 100} %`);
    //     logger.debug(`正在查询的法院:所有的法院${i}/${courtsData.length}`);
    //     logger.debug("");
    //     try{
    //         searchObj = await setAllParams();
    //         searchObj.param = searchObj.param + `,基层法院:${courtsData[i]}`;
    //         result = await getTreeList(searchObj.guid, searchObj.number, searchObj.param, searchObj.vl5x);
    //         result = JSON.parse(eval(result));
    //         result.forEach(element => {
    //             Dao.insertListContent(element);
    //         });
    //         //如果获取时出现remind key则重新获取cookie
    //         while (result === '"remind key"') {
    //             logger.debug(`<<出现remind key>>`);
    //             searchObj = await setAllParams();
    //             searchObj.param = searchObj.param + `,基层法院:${courtsData[i]}`;
    //             result = await getTreeList(searchObj.guid, searchObj.number, searchObj.param, searchObj.vl5x);
    //             result = JSON.parse(eval(result));
    //             result.forEach(element => {
    //                 Dao.insertListContent(element);
    //             });
    //         }
    //     } catch(e) {
    //         result = await getTreeList(searchObj.guid, searchObj.number, searchObj.param, searchObj.vl5x);
    //         //如果获取时出现remind key则重新获取cookie
    //         while (result === '"remind key"') {
    //             searchObj = await setAllParams();
    //             searchObj.param = searchObj.param + `,基层法院:${courtsData[i]}`;
    //             result = await getTreeList(searchObj.guid, searchObj.number, searchObj.param, searchObj.vl5x);
    //             result = JSON.parse(eval(result));
    //             result.forEach(element => {
    //                 Dao.insertListContent(element);
    //             });
    //         }
    //     }
    // }

    logger.debug(`----------------------------------------> 开始获取文章内容`);

    //  获取所有的文书列表
    let wenshuList = await Dao.getWenShuList();
    //  暂未测试
    wenshuList.forEach(element => {
        if (element.run_eval) {
            element.RunEval = element.run_eval;
        } 
        element["文书ID"] = element.ID;
    });
    contentList = wenshuList;

    for (let i = 0; i < contentList.length; i++) {
        logger.debug(`获取文书数据进度：${i}`)
        if (contentList[i].hasOwnProperty('RunEval')) {
            (() => {
                //替换默认setTimeout，因为Node的setTimeout默认不能支持字符串
                setTimeout = function (string) {
                    eval(string);
                }
                eval(unzip(contentList[i]['RunEval']));
            })()
        } else {
            let realId;
            try {
                realId = Navi(contentList[i]['文书ID']);
            } catch (e) {
                logger.error(`<<为文书 <${contentList[i]['文书ID']}> 解密失败>>`);
            }
            try {
                // await sleep(200);
                let doc = await getDoc(realId);

                let docHtml,docSourceText,docDirData,judgeResult;

                // 解析文书HTML
                try {
                    logger.debug(doc);
                    docHtml = Util.getHtmlData(doc);
                } catch (e) {
                    logger.error("解析文书HTML失败");
                }

                // 解析文书原文
                try {
                    docSourceText = Util.getSourceText(doc);
                } catch (e) {
                    logger.error("解析文书原文失败");
                }

                // 解析文书相关信息
                try {
                    docDirData = Util.getDirData(doc);
                } catch (e) {
                    logger.error("解析文书相关信息失败");
                }

                // 解析文书判决结果
                try {
                    judgeResult = Util.getResOfJudge(docSourceText);
                } catch (e) {
                    logger.error("解析文书判决结果失败");
                }

                Dao.insertWenShu(doc);
            } catch (e) {
                logger.error(e);
                logger.error(`<<获取文书 <${contentList[i]['文书ID']}> 详情失败>>`);
            }
        }
    }
}

async function getOnePageWenShu (param, page, proxy) {
    // 以下为获取一页文书列表
    console.log(param, page, proxy);
    searchParamObj = await setAllParams_multi(param, proxy);
    let result = await getTreeList(searchParamObj.guid, 
                                   searchParamObj.number,
                                   searchParamObj.param,
                                   searchParamObj.vl5x,
                                   page,
                                   proxy);
    result = JSON.parse(eval(result));
    await redisDao.pushListDetail(result);
    result.forEach(element => {
        Dao.insertListContent(element);
    });
    return result;
}

async function getOneWenShuDetail (isRunEval, docId, proxy) {
    if (isRunEval) {
        setTimeout = function (string) {
            eval(string);
        }
        eval(unzip(docId))
        console.log("执行编译");
        console.log(com.str._IV);
    } else {
        let realId = Navi(docId);
        let doc = await getDoc(realId, proxy);
        let test = /审判程序/;
        if (doc.match(test)){
            Dao.insertWenShu(doc);
        } else {
            // 若失败，则尝试递归获取
            // logger.error("正在尝试递归获取");
            // await getOneWenShuDetail(isRunEval, docId, proxy);
        }
        return doc;
    }
}

// 若要单进程运行，请取消如下注释

// try {
//     main();
// } catch (e) {
//     logger.error(e);
//}

module.exports = {
    sleep,
    getCookie,
    getvjkl5,
    createGuid,
    get_key,
    getNumber,
    getProxy,
    getDoc,
    setAllParams,
    Navi,
    getTreeList,
    getOnePageWenShu,
    getOneWenShuDetail,
    setProxyPool
}
