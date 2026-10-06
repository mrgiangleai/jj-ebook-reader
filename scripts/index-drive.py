import json,re,urllib.request,time,sys
from pathlib import Path
ROOT='1eEWmqXZZmDXx4QsmsTsnjkgUMp7pe6EH'
def load(fid):
 s=urllib.request.urlopen('https://drive.google.com/drive/folders/'+fid,timeout=30).read().decode()
 m=re.search(r"window\['_DRIVE_ivd'\] = '([^']*)'",s)
 if not m: raise ValueError('Không đọc được thư mục '+fid)
 v=re.sub(r'\\x([0-9a-fA-F]{2})',lambda m:chr(int(m[1],16)),m[1]).replace('\\/','/')
 d=json.loads(v)
 items=[{'id':x[0],'name':x[2],'mimeType':x[3]} for x in d[0]]
 return {'files':items,'snapshot':True,'notice':'Danh mục test lấy từ trang Drive công khai; có thể chưa gồm toàn bộ dữ liệu nếu Drive phân trang.'}
def save(fid,data):
 Path('public/data/'+fid+'.json').write_text(json.dumps(data,ensure_ascii=False))
root=load(ROOT);save(ROOT,root)
for item in root['files'][:3]:
 try:
  data=load(item['id']);save(item['id'],data);print(item['name'],len(data['files']),flush=True)
  for child in data['files'][:3]:
   if child['mimeType']=='application/vnd.google-apps.folder':
    sub=load(child['id']);save(child['id'],sub);print(' ',child['name'],len(sub['files']),flush=True)
 except Exception as e: print(e,flush=True)
