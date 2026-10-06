exec(open('scripts/index-drive.py').read().split('root=load(ROOT)')[0])
from concurrent.futures import ThreadPoolExecutor
root=json.loads(Path('public/data/'+ROOT+'.json').read_text())
def index(item):
 try:
  data=load(item['id']);save(item['id'],data)
  def first(data,depth=0):
   entries=sorted(data['files'],key=lambda x:x['name'])
   media=next((x for x in entries if x['mimeType'].startswith('image/') or x['mimeType']=='application/pdf'),None)
   if media:return media
   if depth>=3:return None
   folder=next((x for x in entries if x['mimeType']=='application/vnd.google-apps.folder'),None)
   if folder:
    child=load(folder['id']);save(folder['id'],child);return first(child,depth+1)
  cover=first(data)
  if cover:item['coverFile']=cover
  return item
 except Exception as e:print(item['name'],str(e),flush=True);return item
with ThreadPoolExecutor(max_workers=4) as pool:root['files']=list(pool.map(index,root['files']))
save(ROOT,root);print('Indexed',len(root['files']),flush=True)
