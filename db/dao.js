const mysql = require("mysql");
const config = require("../config/config");
const log4js = require("log4js");
const logger = log4js.getLogger();
logger.level = 'debug';

const pool = mysql.createPool({
  host:config.database.host,
  user:config.database.user,
  password:config.database.password,
  database:config.database.database
})

const Query=( sql , ...params )=>{
  return new Promise(function(resolve,reject){
      pool.getConnection(function(err,connection){
          if(err){
              console.log(err);
              reject(err);
              return; 
          }
          connection.query( sql , params , function(error,res){
              connection.release();
              if(error){
                  console.log(error);
                  reject(error);
                  return;
              }
              resolve(res);
          });
      });
  });
};

/**
 * 
 * @param {*} ListContent 文书列表内容
 */
async function insertListContent(ListContent) {
  logger.debug("正在插入列表内容");
  logger.debug("插入的内容是！！");
  logger.debug([ListContent['裁判要旨原文'],
  ListContent['不公开理由'],
  ListContent['案件类型'],
  ListContent['裁判日期'],
  ListContent['案件名称'],
  ListContent['文书ID'],
  ListContent['审判程序'],
  ListContent['案号'],
  ListContent['法院名称'],
  ListContent['RunEval']
 ]);
  Object.keys(ListContent).forEach(key => {
    if (!ListContent[key]) {
      ListContent[key] = ""
    }
  })
  await Query('insert into WenshuList(main_text, reason_not_open, ws_type, ws_time, ws_name, ID, program,ws_number, court_name, run_eval) values(?,?,?,?,?,?,?,?,?,?)', 
   ListContent['裁判要旨段原文'],
   ListContent['不公开理由'],
   ListContent['案件类型'],
   ListContent['裁判日期'],
   ListContent['案件名称'],
   ListContent['文书ID'],
   ListContent['审判程序'],
   ListContent['案号'],
   ListContent['法院名称'],
   ListContent['RunEval']
  );
}

/**
 * 
 * @param {*} wenshu 文书的内容，还没有对其进行处理
 */
async function insertWenShu(wenshu) {
  logger.error("正在插入文书内容");
  return await Query('insert into WenshuData values(?)', wenshu);
}

/**
 * 获取文书列表
 */
async function getWenShuList () {
  return await Query('select * from WenshuList');
}

/**
 * 获取有效文书列表
 */
async function getAllWorkedWenShuList () {
  return await Query('select * from WenshuList where ws_name is not null');
}

/**
 * 获取所有获取到的完整文书
 */
async function getAllWenShu () {
  return await Query('select * from WenshuData');
}

module.exports = {
  insertListContent,
  insertWenShu,
  getWenShuList
}