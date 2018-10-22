const Dao = require("../db/dao");
const cheerio = require("cheerio");
const log4js = require("log4js");
const logger = log4js.getLogger();
/**
 * 获取HTML数据
 * @param {string} str 
 */
function getHtmlData (str) {
    let jsonDataReg = /var jsonHtmlData = "(.*)";/;
    eval(jsonDataReg.exec(str)[0]);
    return JSON.parse(jsonHtmlData).Html;
};

/**
 * 
 * 获取裁判文书原文
 * @param {string} str 裁判文书网返回的json 
 */
function getSourceText (str) {
    let jsonDataReg = /var jsonHtmlData = "(.*)";/;
    let html;
    eval(jsonDataReg.exec(str)[0]);
    try {
        html = JSON.parse(jsonHtmlData).Html;
    } catch (e) {
        logger.error("解析HTML文本JSON数据失败");
    }
    let $ = cheerio.load(html);
    // wenshuText是文书原文
    return $("body").text();
}

/**
 * 
 * 获取裁判文书相关数据
 * @param {string} str 裁判文书网返回的json
 *  
 */
function getDirData (str) {
    let dirReg = /var dirData = (.*)}]}]}/;
    eval(dirReg.exec(str)[0]);
    // dirData是法规和相关信息
    return dirData;
}

/**
 * 获得判决结果
 * @param {string} sourceStr 裁判文书原文
 */
function getResOfJudge (sourceStr) {
    let resReg = /(判决如下：(.*)。)/;
    if (!resReg.test(sourceStr)) {
        resReg = /(裁定如下：(.*))。/
        if (!resReg.exec(sourceStr)[1])
            return resReg.exec(sourceStr)[0];
        else return resReg.exec(sourceStr)[1];
    } else {
        if (!resReg.exec(sourceStr)[1])
            return resReg.exec(sourceStr)[0];
        else return resReg.exec(sourceStr)[1];
    }
}

/**
 * 获取事实
 * @param {string} str 
 */
function getFact (str) {
    let factRegGroup = [
        /经审理查明/,
        /本院认定如下/,
    ]
}

module.exports = {
    getDirData,
    getFact,
    getHtmlData,
    getResOfJudge,
    getSourceText
}