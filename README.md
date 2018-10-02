# 裁判文书网爬虫

利用Node.js爬取裁判文书网的数据

## 使用方法
首先clone本项目

在config文件夹中的config.js中配置

```
proxy.address为代理IP提供商地址，因为爬取裁判文书网必须有代理，不然封禁IP是一定的
search.param为要搜索的参数内容，请按照格式填写
```


```
npm install 
node index.js
```
## 项目结构

    config -----配置文件
    data -----全国法院列表
    index.js -----项目主文件

## 暂未完成
    - 存储暂时未完成，将在两到三天内完成，给自己放个小假
    - 在运行时，可能有一些未捕获的错误

## 欢迎大家提出Issue和Pr