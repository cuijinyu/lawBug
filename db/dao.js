const mysql = require("mysql");
const config = require("../config/config");

const connection = mysql.createConnection({
  host:config.database.host,
  user:config.database.user,
  password:config.database.password,
  database:config.database.database
})

function Query(query, params) {
  return new Promise((resolve, reject) => {
    connection.connect();
    connection.query(query, params, (err, res) => {
      if (err) {
        connection.end();
        reject(err);
      }
      connection.end();
      resolve(res);
    })
  })
}

async function insertListContent(ListContent) {
  console.log("正在插入列表内容");
  return await Query('insert into WenshuList value(?)', ListContent);
}

async function insertWenShu(wenshu) {
  console.log("正在插入文书内容");
  return await Query('insert into WenshuData value(?)', wenshu);
}

module.exports = {
  insertListContent,
  insertWenShu
}