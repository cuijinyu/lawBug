const Dao = require("../db/dao");
const cheerio = require("cheerio");
const log4js = require("log4js");
const fs = require("fs");
const logger = log4js.getLogger();
const {
    getDirData,
    getFact,
    getHtmlData,
    getResOfJudge,
    getSourceText
} = require("./getInfo")

// try {
//     (async () => {
//         let List = await Dao.getAllWorkedWenShuList();
//         let temp = [];
//         for (let i = 0; i < List.length;i ++) {
//             temp.push(List[i]);
//             console.log("正在处理" + i)
//         }
//         fs.writeFileSync('List.json', JSON.stringify(temp));
//     })()
// } catch (e) {

// }
try {
    (async () => {
        let temp = [];
        for (let j = 0;j < 12;j++){
            let allWenShu = await Dao.getAllWenShu(j*1000,1000);
            let count = 0;
            for (let i = 0;i < allWenShu.length; i++) {
                let data;
                allWenShu[i]['success'] = true;
                // try {
                //     data = getSourceText(allWenShu[i].jsonData);
                //     temp.push({
                //         '原文':data
                //     })
                // } catch (e) {
                //     logger.error(`第${i}例文书原文解析失败`);
                //     allWenShu[i]['success'] = false;
                // }

                try {
                    data = getResOfJudge(getSourceText(allWenShu[i].jsonData));
                    temp.push({
                        '结论':data
                    })
                } catch (e) {
                    logger.error(`第${i}例文书结果解析失败`);
                    allWenShu[i]['success'] = false;
                }
                
                // try {
                //     data = getDirData(allWenShu[i].jsonData);
                // } catch (e) {
                //     logger.error(`第${i}例文书相关数据解析失败`);
                //     allWenShu[i]['success'] = false;
                // }

                // try {
                //     data = getHtmlData(allWenShu[i].jsonData);
                // } catch (e) {
                //     logger.error(`第${i}例文书HTML解析失败`);
                //     allWenShu[i]['success'] = false;
                // }

                if (allWenShu[i]['success']) {
                    logger.info(`第${i}例文书解析成功`);
                    count ++;
                }
            }
        }
        fs.writeFileSync("结论.json", JSON.stringify(temp));
    })()
} catch (e) {
    logger.info("失败");
}