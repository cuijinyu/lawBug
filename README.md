# 裁判文书网爬虫

利用Node.js爬取裁判文书网的数据

多进程爬虫利用redis作为任务队列

本项目仅为学习使用，未大规模尝试爬取
## 外部依赖

node > v8.0

mysql

redis

## 使用方法

首先clone本项目

### 单进程版本配置方法

在config文件夹中的config.js中配置

```
proxy.address 为代理IP提供商地址，因为爬取裁判文书网必须有代理，不然封禁IP是一定的
search.param 为要搜索的参数内容，请按照格式填写
database 为数据库配置，本项目采用mysql
```

### 多进程版本配置方法
```
不用在config中配置param，在multi_process.js中配置请求参数队列,params数组即为参数队列

其他配置如上
```

## 安装依赖
```
npm install 
```

## 单进程运行
```
npm start
```

## 多进程运行
```
npm run multi
```

## 清空redis状态 ( 一般用于重新开始任务队列 )
```
npm run clean
```

## 项目结构

    config/ -----配置文件
    data/ -----全国法院列表
    db/ ------数据库配置
    proxyPool/ ------代理池，为了加快代理获取速度
    util/  ------工具集，包括提取文书信息的工具
    index.js -----项目主文件
    multi_process.js ------多进程版本主文件
    son_getDoc.js ------子进程，用于获取文书全文
    son_getList.js ------子进程，用于获取文书列表
    wenshu.sql ------所需建的表
    cutWord.py --------分词所用的脚本

## 暂未完成
    - 完善的日志系统
    - 错误警报

## 欢迎大家提出Issue和Pr