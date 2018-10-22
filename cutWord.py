import jieba
import json
import xlwt
from collections import Counter
xlsFiles = "结论四字以上分词.xls"
workbook = xlwt.Workbook(encoding = 'utf-8')
worksheet = workbook.add_sheet('四字以上数据一')
wenshu = open('结论.json', 'r', encoding='utf8')
wenshuData = wenshu.read()
def isAString(obj):
   try:obj+''
   except:return False
   else:return True
shenpan = {
    '一审':0,
    '二审':0,
    '再审':0
}
wenshuDataArray = json.loads(wenshuData)
yuanwenString = ""
for i in range(len(wenshuDataArray)):
    if '结论' in wenshuDataArray[i]:
        if isAString(wenshuDataArray[i]['结论']):
            yuanwenString += wenshuDataArray[i]['结论'] + "。"
aimWords =[x for x in jieba.cut(yuanwenString) if len(x) > 3]
c = Counter(aimWords).most_common(300)
print(c)
for i in range(len(c)):
    worksheet.write(i, 0, label = c[i][0])
    worksheet.write(i, 1, label = c[i][1])
workbook.save(xlsFiles)
