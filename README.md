# 裁判文书网爬虫

利用Node.js爬取裁判文书网的数据

## 使用方法
首先clone本项目

在config文件夹中的config.js中配置

```
proxy.address 为代理IP提供商地址，因为爬取裁判文书网必须有代理，不然封禁IP是一定的
search.param 为要搜索的参数内容，请按照格式填写
database 为数据库配置，本项目采用mysql
```


```
npm install 
node index.js
```
## 项目结构

    config -----配置文件
    data -----全国法院列表
    db ------数据库配置
    util -------数据提取处理配置文件
        getInfo.js  -------用于从未经处理的文书全文中获取文书正文，相关法律条文和判决结果
        output.js  --------用于从数据库中提取输出
    index.js -----项目主文件
    wenshu.sql ------所需建的表
    cutWord.py --------分词所用的脚本

## 暂未完成
    - 还未测试对文书全文的存储
    - 在运行时，可能有一些未捕获的错误

## 欢迎大家提出Issue和Pr
