const redis = require("redis");
const client = redis.createClient(6379, '127.0.0.1');

module.exports = {
    pushListTarget (jsonData) {
        return new Promise((resolve, reject) => {
            client.rpush("list", JSON.stringify(jsonData),(err, res) => {
                if (err) {
                    reject(err);
                }
                resolve(res);
            })
        })
    },
    popListTarget () {
        return new Promise((resolve, reject) => {
            client.lpop("list", (err, res) => {
                if (err) {
                    reject(err)
                }
                resolve(res);
            })
        })
    }
}