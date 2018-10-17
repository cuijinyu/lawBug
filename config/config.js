module.exports = {
    proxy:{
        address:"http://api.ip.data5u.com/dynamic/get.html?order=d8308e3b2f42b4e2d2914a2dd061b3cb&sep=3", //  用来设置代理地址
    },
    search:{
        param:"全文检索:医疗损害责任纠纷",   //  用于搜索的参数
    },
    database:{
        host:"localhost",
        user:"root",
        password:"",
        database:"wenshu"
    }
}