// Each cover owns at most four searches; the first valid candidate wins.
export async function findCover(album, { list, sort, active, accept = async()=>true, images = [], signal, visited = new Set(), tried = new Set() }) {
 const controller=new AbortController();
 const running=()=>!controller.signal.aborted&&active();
 const abort=()=>controller.abort();
 signal?.addEventListener('abort',abort,{once:true});
 if(signal?.aborted)abort();
 async function tryFile(file){
  if(!file||tried.has(file.id)||!running())return null;
  tried.add(file.id);
  try{return await accept(file,controller.signal)&&running()?file:null;}catch{return null;}
 }
 try{
  if(!running())return null;
  if(album.imageAlbum){for(const file of images){const found=await tryFile(file);if(found)return found;}return null;}
  if(album.mimeType==='application/pdf'||album.mimeType?.startsWith('image/'))return await tryFile(album);
  if(album.coverFile){const found=await tryFile(album.coverFile);if(found)return found;}
  return await new Promise(resolve=>{
   const queue=[album];let count=0,done=false;
   const finish=found=>{if(done)return;done=true;controller.signal.removeEventListener('abort',cancel);controller.abort();resolve(found);};
   const cancel=()=>finish(null);
   controller.signal.addEventListener('abort',cancel,{once:true});
   async function search(folder){
    if(!running()||visited.has(folder.id))return null;
    visited.add(folder.id);
    let data;try{data=await list(folder.id,{signal:controller.signal});}catch{return null;}
    if(!running())return null;
    const items=sort([...data.files]);
    for(const media of items.filter(f=>f.mimeType.startsWith('image/')||f.mimeType==='application/pdf')){
     const found=await tryFile(media);if(found)return found;
    }
    if(running())queue.unshift(...items.filter(f=>f.mimeType==='application/vnd.google-apps.folder'));
    return null;
   }
   function pump(){
    if(done)return;
    if(!running()){finish(null);return;}
    while(count<4&&queue.length){
     const folder=queue.shift();count++;
     void search(folder).then(found=>{count--;if(found)finish(found);else pump();},()=>{count--;pump();});
    }
    if(!count&&!queue.length)finish(null);
   }
   pump();
  });
 }finally{signal?.removeEventListener('abort',abort);controller.abort();}
}
