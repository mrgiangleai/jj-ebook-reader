// Keep searching in natural order until a real candidate successfully loads.
export async function findCover(album, { list, sort, active, accept = async()=>true, images = [], visited = new Set(), tried = new Set() }) {
 if(!active())return null;
 async function tryFile(file){
  if(!file||tried.has(file.id)||!active())return null;
  tried.add(file.id);
  try{return await accept(file)&&active()?file:null;}catch{return null;}
 }
 if(album.imageAlbum){for(const file of images){const found=await tryFile(file);if(found)return found;}return null;}
 if(album.mimeType==='application/pdf'||album.mimeType?.startsWith('image/'))return tryFile(album);
 if(album.coverFile){const found=await tryFile(album.coverFile);if(found)return found;}
 if(visited.has(album.id))return null;
 visited.add(album.id);
 let data;try{data=await list(album.id);}catch{return null;}
 if(!active())return null;
 const items=sort([...data.files]);
 for(const media of items.filter(f=>f.mimeType.startsWith('image/')||f.mimeType==='application/pdf')){
  const found=await tryFile(media);if(found)return found;
 }
 for(const folder of items.filter(f=>f.mimeType==='application/vnd.google-apps.folder')){
  const found=await findCover(folder,{list,sort,active,accept,images,visited,tried});if(found)return found;
 }
 return null;
}
