const redis = require("redis");
const client = redis.createClient(6379, '127.0.0.1');
const operations = {
    pushListTarget (jsonData) {
        return new Promise((resolve, reject) => {
            client.rpush("target", JSON.stringify(jsonData),(err, res) => {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(res);
            })
        })
    },

    popListTarget () {
        return new Promise((resolve, reject) => {
            client.lpop("target", (err, res) => {
                if (err) {
                    console.log(err);
                    reject(err)
                }
                resolve(res);
            })
        })
    },

    getListTargetLength () {
        return new Promise((resolve, reject) => {
            client.llen("target", (err, res) => {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(res);
            })
        })
    },

    pushListProxy (data) {
        return new Promise((resolve, reject) => {
            client.rpush('proxy', data, (err, res) => {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(res);
            })
        })
    },

    popListProxy () {
        return new Promise((resolve, reject) => {
            client.lpop('proxy', (err, res) => {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(res);
            })
        })
    },

    unshiftListProxy (data) {
        return new Promise((resolve, reject) => {
            client.lpush('proxy', data, (err, res) => {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(res);
            })
        })
    },

    getListProxyLength () {
        return new Promise((resolve, reject) => {
            client.llen('proxy', (err, res) => {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(res);
            })
        })
    },

    /**
     * 清空代理队列，用来维护高效有用的代理
     */
    flushProxy () {
        return new Promise((resolve, reject) => {
            client.ltrim("proxy", 1, 0, (err, res) => {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(res);
            })
        })
    },

    pushListDetail (jsonData) {
        return new Promise((resolve, reject) => {
            client.rpush("detail", JSON.stringify(jsonData),(err, res) => {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(res);
            })
        })
    },

    popListDetail () {
        return new Promise((resolve, reject) => {
            client.lpop("detail", (err, res) => {
                if (err) {
                    console.log(err);
                    reject(err)
                }
                resolve(res);
            })
        })
    },

    getListDetailLength () {
        return new Promise((resolve, reject) => {
            client.llen("detail", (err, res) => {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(res);
            })
        })
    },

    saveRedis () {
        return new Promise((resolve, reject) => {
            client.save((err, res) => {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(res);
            })
        })
    },

    flushAll () {
        return new Promise((resolve, reject) => {
            client.flushall((err, res) => {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(res);
            });
        })
    }
}
module.exports = operations;