const request = require('request').defaults({jar: true});   //  使用全局cookie
const fs = require('fs');
const qs = require('qs');
const Dao = require('./db/dao');
const De = require('./lib/de');
const config = require('./config/config');
const getKey = require('./lib/getKey');
const unzip = De.unzip;

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

let courtsData = fs.readFileSync('./data/courts.txt', 'utf-8'); //  全国法院数组
courtsData = eval(courtsData);

function getCookie () {
    return new Promise( (resolve, reject) => {
        request.get("http://wenshu.court.gov.cn/list/list/?sorttype=1", (err, res, body) => {
            if (err) {
                console.log(err);
                reject(err);
            }
            // console.log(res.headers["set-cookie"]);
            resolve(res.headers["set-cookie"]);
        })  
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

function getNumber (guid) {
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
    return new Promise( (resolve, reject) => {
        //  代理IP
        request(`${config.proxy.address}`, (err, res, body) => {
            if (err) {
                reject(err);
            }
            console.log(`<!使用IP代理-------->${body}`);
            resolve(body);
        })
    })
}

function getDoc (realId) {
    return new Promise ((resolve, reject) => {
        (async () => {
            let proxy = await getProxy();
            request(`http://wenshu.court.gov.cn/CreateContentJS/CreateContentJS.aspx?DocID=${realId}`, {
                'proxy':"http://" + proxy
            }, (err, res, body) => {
                try {
                    if (err) {
                        reject(err);
                    }
                } catch (e) {
                    console.warn(e);
                }
                resolve(body);
            })
        })()
    })
}

function getGuid () {
    return createGuid() + createGuid() + '-' + createGuid() + '-' + createGuid() + createGuid() + '-' + createGuid() + createGuid() + createGuid();
}

async function getTreeList (guid, number, param, vl5x, index = 1) {
    console.log(arguments);
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
            timeout:1000,
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
                let proxy = await getProxy();
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
                            console.log(err);
                            clearTimeout(timeWatcher);
                            reject(err);
                        }
                        console.log(body);
                        clearTimeout(timeWatcher);
                        resolve(body);
                    })
                } catch (e) {
                    console.log("获取超时，正在进行重试");
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
                console.log("获取超时，正在进行重试");
                getTreeList(guid, number, param, vl5x, index);
            }
        }
    }).catch(e => {
        console.log("获取超时")
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
    console.log(`设置Cookie为 -----> ${cookie}`);
    console.log(`设置vjkl5为 -----> ${vjkl5}`);
    console.log(`设置number为 -----> ${number}`);
    console.log(`设置vl5x为 -----> ${vl5x}`);
    //查询所用的参数
    let param = `${config.search.param}`;
    console.log(`设置查询参数为 -----> ${config.search.param}`);
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
    console.log(`----------------------------------------> 开始获取列表`);

    for (let i = 0; i < courtsData.length; i ++) {
        console.log("");
        console.log(`<<正在查询 <${courtsData[i]}> 法院的数据>>`);
        console.log(`获取法院数据进度：${i / courtsData.length * 100} %`);
        console.log(`正在查询的法院:所有的法院${i}/${courtsData.length}`);
        console.log("");
        try{
            searchObj = await setAllParams();
            searchObj.param = searchObj.param + `,基层法院:${courtsData[i]}`;
            result = await getTreeList(searchObj.guid, searchObj.number, searchObj.param, searchObj.vl5x);
            Dao.insertListContent(result);
            //如果获取时出现remind key则重新获取cookie
            while (result === '"remind key"') {
                console.log(`<<出现remind key>>`);
                searchObj = await setAllParams();
                searchObj.param = searchObj.param + `,基层法院:${courtsData[i]}`;
                result = await getTreeList(searchObj.guid, searchObj.number, searchObj.param, searchObj.vl5x);
            }
            try {
                result = JSON.parse(eval(result));
                contentList = [...contentList, ...result];
                console.log(result);
            } catch (e) {
                console.log(`<<处理 <${courtsData[i]}> 法院数据时出现错误>>`)
            }
        } catch(e) {
            result = await getTreeList(searchObj.guid, searchObj.number, searchObj.param, searchObj.vl5x);
            //如果获取时出现remind key则重新获取cookie
            while (result === '"remind key"') {
                searchObj = await setAllParams();
                searchObj.param = searchObj.param + `,基层法院:${courtsData[i]}`;
                result = await getTreeList(searchObj.guid, searchObj.number, searchObj.param, searchObj.vl5x);
            }
            try {
                result = JSON.parse(eval(result));
                contentList = [...contentList, ...result];
                console.log(result);
            } catch (e) {
                console.log(`<<处理 <${courtsData[i]}> 法院数据时出现错误>>`)
            }
        }
    }

    console.log(`----------------------------------------> 开始获取文章内容`);
    for (let i = 0; i < contentList.length; i++) {
        console.log(`获取文书数据进度：${i / courtsList.length * 100} %`)
        if (contentList[i].hasOwnProperty('RunEval')) {
            (() => {
                //替换默认setTimeout，因为Node的setTimeout默认不能支持字符串
                setTimeout = function (string) {
                    eval(string);
                }
                eval(unzip(contentList[i]['RunEval']));
            })()
        } else {
            try {
                let realId = Navi(contentList[i]['文书ID']);
            } catch (e) {
                console.log(`<<为文书 <${contentList[i]['文书ID']}> 解密失败>>`);
            }
            try {
                let doc = await getDoc(realId);
            } catch (e) {
                console.log(`<<获取文书 <${contentList[i]['文书ID']}> 详情失败>>`);
            }
        }
    }
}

try {
    main();
} catch (e) {
    console.log("连接超时");
}