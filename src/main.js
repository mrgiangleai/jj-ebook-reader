import './style.css';
import { findCover } from './cover-source.js';
const ROOT='1eEWmqXZZmDXx4QsmsTsnjkgUMp7pe6EH';
const $=s=>document.querySelector(s), app=$('#app');
let trail=[],files=[],pages=[],spread=0,request=0,key=localStorage.getItem('jj-api-key')||'';
let shelfPage=0,pageSize=8,resume=null,pdfIndex=0,pdfs=[],opening=false,coversEnabled=false,coverEpoch=0,coverQueue=Promise.resolve(),coverAbort=null;
const folderCache=new Map();
let coverScope=ROOT,coverRevision='',savedCovers={};
function restoreCoverCache(scope){
 coverScope=scope;try{const saved=JSON.parse(localStorage.getItem('jj-covers-'+scope));coverRevision=saved?.revision||'';savedCovers=saved?.files||{};}catch{savedCovers={};coverRevision='';}
}
const workerReady=(async()=>{
 if(!('serviceWorker' in navigator))return false;
 try{await navigator.serviceWorker.register('./sw.js');await navigator.serviceWorker.ready;
 if(!navigator.serviceWorker.controller)await new Promise(resolve=>{navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true});setTimeout(resolve,3000)});
 return !!navigator.serviceWorker.controller;
 }catch{return false;}
})();
try{resume=JSON.parse(localStorage.getItem('jj-library-state'));if(resume?.coverVersion===1&&[4,8,12].includes(resume?.pageSize))pageSize=resume.pageSize;}catch{}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sort=a=>a.sort((a,b)=>a.name.localeCompare(b.name,'vi',{numeric:true}));
const img=f=>`https://drive.google.com/thumbnail?id=${encodeURIComponent(f.id)}&sz=w800`;
app.innerHTML=`<header><a class="brand" href="#">JJ<span> / EBOOK READER</span></a><button id="settings">Cấu hình Drive</button></header><main><section class="intro"><div class="eyebrow">MỘT GÓC NHỎ ĐỂ ĐỌC</div><h1>Kệ sách của bạn<span>.</span></h1><p>Mở một album. Lật từng trang. Chậm lại một chút.</p><form id="source"><input id="link" aria-label="Link thư mục Google Drive" placeholder="Dán đường link thư mục Google Drive…" value="https://drive.google.com/drive/folders/${ROOT}"><button>Mở kệ sách ↗</button></form></section><div class="librarybar"><nav id="crumbs"></nav><div class="librarycontrols"><input id="filter" placeholder="Tìm theo tiêu đề…" aria-label="Tìm sách"><label>Sách / trang <select id="page-size"><option>4</option><option>8</option><option>12</option></select></label></div></div><p id="status" role="status"></p><section id="shelf" aria-label="Kệ sách"></section><div class="pagination"><button id="shelf-prev">← Trang trước</button><span id="shelf-position" role="status"></span><button id="shelf-next">Trang sau →</button></div><footer>JJ EBOOK READER <span>Ảnh từ Google Drive · Vị trí đọc lưu trên thiết bị</span></footer></main><dialog id="reader"><div class="readerbar"><button id="close">← Kệ sách</button><strong id="title"></strong><button id="fullscreen">⛶ Toàn màn hình</button></div><div class="stage"><button id="prev" class="turn" aria-label="Trang trước">‹</button><div id="spread"></div><button id="next" class="turn" aria-label="Trang sau">›</button></div><div class="readerfoot"><span id="position"></span><input id="jump" type="range" min="0" aria-label="Chọn cặp trang"><span>← → để lật trang</span></div></dialog><dialog id="pdf-reader"><div class="readerbar"><button id="pdf-close">← Kệ sách</button><strong id="pdf-title"></strong><a id="pdf-external" target="_blank" rel="noopener">Mở trên Drive ↗</a></div><iframe id="pdf-frame" title="Nội dung PDF" allow="fullscreen"></iframe><div class="pdf-controls"><button id="pdf-prev">← Prev · Tập trước</button><span id="pdf-position" role="status"></span><button id="pdf-next">Next · Tập sau →</button><button id="pdf-back">← Quay lại thư mục bìa sách</button></div></dialog><dialog id="config"><h2>Kết nối Google Drive</h2><p>Link mẫu có danh mục test sẵn. Để duyệt link công khai khác, nhập Google Drive API key đã bật Drive API. Không cần đăng nhập.</p><input id="apikey" type="password" placeholder="Google Drive API key" aria-label="Google Drive API key"><p>Key chỉ lưu trên trình duyệt này. Giới hạn key theo tên miền của app trong Google Cloud.</p><button id="savekey">Lưu cấu hình</button><button id="cancelkey">Đóng</button></dialog>`;
async function fetchFolder(id){
 if(!key){const r=await fetch(`./data/${encodeURIComponent(id)}.json`);if(!r.ok)throw Error('Thư mục này chưa có trong danh mục test. Cấu hình Drive API key để duyệt đầy đủ.');return r.json();}
 const all=[];let token='';do{const u=new URL('https://www.googleapis.com/drive/v3/files');u.search=new URLSearchParams({key,q:`'${id}' in parents and trashed = false`,fields:'nextPageToken,files(id,name,mimeType,resourceKey)',pageSize:'1000',...(token?{pageToken:token}:{})});const r=await fetch(u);const d=await r.json();if(!r.ok)throw Error(d.error?.message||'Không truy cập được Drive.');all.push(...d.files);token=d.nextPageToken;}while(token);return {files:all};
}
function list(id){
 if(!folderCache.has(id)){
  const task=fetchFolder(id).catch(error=>{folderCache.delete(id);throw error;});
  folderCache.set(id,task);
 }
 return folderCache.get(id);
}
async function openFolder(id,name,reset=false,restore=null){const n=++request;$('#status').textContent='Đang mở kệ sách…';try{const d=await list(id);if(n!==request)return;files=sort(d.files.filter(f=>f.mimeType==='application/vnd.google-apps.folder'||f.mimeType.startsWith('image/')||f.mimeType==='application/pdf'));trail=reset?[{id,name}]:[...trail,{id,name}];shelfPage=restore?.shelfPage||0;if(!restore)$('#filter').value='';$('#status').textContent=d.snapshot?d.notice:'';render();if(restore?.pdfOpen){const found=files.find(f=>f.id===restore.pdfId&&f.mimeType==='application/pdf');if(found)readPdf(found.id);}else if(restore?.readerOpen){const images=files.filter(f=>f.mimeType.startsWith('image/'));if(images.length)read(images);}}catch(e){if(n===request)$('#status').textContent=e.message;}}
function saveLibrary(){
 if(!trail.length)return;
 localStorage.setItem('jj-library-state',JSON.stringify({coverVersion:1,trail,shelfPage,pageSize,query:$('#filter').value,link:$('#link').value,readerOpen:$('#reader').open,pdfOpen:$('#pdf-reader').open,pdfId:pdfs[pdfIndex]?.id}));
}
function fitTitles(){
 $('#shelf').querySelectorAll('.covername').forEach(el=>{
  let size=25;el.style.fontSize=size+'px';
  while(size>5&&(el.scrollHeight>el.clientHeight||el.scrollWidth>el.clientWidth)){size-=0.5;el.style.fontSize=size+'px';}
 });
}
new ResizeObserver(fitTitles).observe($('#shelf'));
document.fonts.ready.then(fitTitles);
function render(){
 $('#crumbs').innerHTML=trail.map((f,i)=>`<button data-level="${i}">${esc(f.name)}</button>`).join('<span>/</span>');
 $('#crumbs').querySelectorAll('button').forEach(b=>b.onclick=()=>{const f=trail[+b.dataset.level];trail=trail.slice(0,+b.dataset.level);openFolder(f.id,f.name)});
 const query=$('#filter').value.trim().toLocaleLowerCase('vi');
 const folders=files.filter(f=>f.mimeType==='application/vnd.google-apps.folder');
 const images=files.filter(f=>f.mimeType.startsWith('image/'));
 const albums=[...(images.length?[{...trail.at(-1),imageAlbum:true}]:[]),...folders,...files.filter(f=>f.mimeType==='application/pdf')].filter(f=>f.name.toLocaleLowerCase('vi').includes(query));
 const totalPages=Math.max(1,Math.ceil(albums.length/pageSize));
 shelfPage=Math.max(0,Math.min(shelfPage,totalPages-1));
 const visible=albums.slice(shelfPage*pageSize,(shelfPage+1)*pageSize);
 $('#shelf').innerHTML=visible.map((f,i)=>{
  const number=shelfPage*pageSize+i;
  return `<button class="album" ${f.imageAlbum?'id="readalbum"':`data-id="${f.id}"`} style="--hue:${[23,154,207,348,42,263][number%6]}"><div class="cover"><span class="covername">${esc(f.name)}</span><img class="book-art" hidden alt="Bìa ${esc(f.name)}"><span class="cover-loading" hidden>Đang tải bìa…</span></div><h3>${esc(f.name)}</h3><p>${f.imageAlbum?`${images.length} trang · Mở sách ↗`:f.mimeType==='application/pdf'?'PDF · Mở sách ↗':'Mở thư mục ↗'}</p></button>`;

 }).join('');
 if(!albums.length)$('#shelf').innerHTML=query?'<p class="empty">Không tìm thấy sách theo tiêu đề này.</p>':'<p class="empty">Không có album hoặc ảnh phù hợp.</p>';
 $('#shelf-position').textContent=`Trang ${shelfPage+1} / ${totalPages}`;
 $('#shelf-prev').disabled=shelfPage===0;
 $('#shelf-next').disabled=shelfPage===totalPages-1;
 $('#shelf').querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{const f=files.find(f=>f.id===b.dataset.id);zoomOpen(b,()=>f.mimeType==='application/pdf'?readPdf(f.id):openFolder(f.id,f.name))});
 if($('#readalbum'))$('#readalbum').onclick=()=>zoomOpen($('#readalbum'),()=>read(images));
 fitTitles();saveLibrary();loadCovers(visible,images);
}
function loadCoverImage(image,url,signal){
 return new Promise((resolve,reject)=>{
  if(signal.aborted){reject(Error('aborted'));return;}
  const cleanup=()=>{clearTimeout(timer);image.onload=null;image.onerror=null;signal.removeEventListener('abort',abort)};
  const abort=()=>{cleanup();image.removeAttribute('src');reject(Error('aborted'))};
  const timer=setTimeout(()=>{cleanup();image.removeAttribute('src');reject(Error('timeout'))},7000);
  signal.addEventListener('abort',abort,{once:true});
  image.onload=()=>{cleanup();resolve()};image.onerror=()=>{cleanup();image.removeAttribute('src');reject(Error('image'))};image.src=url;
 });
}
function coverUrl(file){return `https://drive.google.com/thumbnail?id=${encodeURIComponent(file.id)}&sz=w150&jjcover=${encodeURIComponent(coverScope)}&jjversion=${encodeURIComponent(coverRevision)}${file.resourceKey?'&resourcekey='+encodeURIComponent(file.resourceKey):''}`;}
function loadCovers(albums,images){
 const epoch=++coverEpoch;coverAbort?.abort();
 const cards=[...$('#shelf').querySelectorAll('.album')];
 const scope=coverScope,revision=coverRevision;
 coverQueue=coverQueue.catch(()=>{}).then(async()=>{
  const persistent=await workerReady;
  for(let i=0;i<albums.length;i++){
   if(epoch!==coverEpoch)return;
   const card=cards[i],image=card.querySelector('.book-art'),loading=card.querySelector('.cover-loading');
   const controller=new AbortController();coverAbort=controller;
   const cached=savedCovers[albums[i].id];
   if(!coversEnabled&&!cached)continue;
   loading.hidden=false;
   try{
    let found=null;
    if(cached&&(coversEnabled||persistent)){
     try{await loadCoverImage(image,coverUrl(cached)+(coversEnabled?'':'&jjcached=1'),controller.signal);found=cached;}catch{}
    }
    if(!found&&coversEnabled){
     found=await findCover(albums[i],{list,sort,images,active:()=>epoch===coverEpoch,accept:async file=>{
      await loadCoverImage(image,coverUrl(file),controller.signal);return true;
     }});
    }
    if(epoch!==coverEpoch)return;
    if(found){
     image.hidden=false;card.querySelector('.covername').hidden=true;
     savedCovers[albums[i].id]=found;
     localStorage.setItem('jj-covers-'+scope,JSON.stringify({revision,files:savedCovers}));
    }else if(coversEnabled){card.querySelector('.covername').textContent='Chưa tải được ảnh bìa';}
   }catch{if(coversEnabled)card.querySelector('.covername').textContent='Chưa tải được ảnh bìa';}
   finally{loading.hidden=true;}
  }
 });
}
async function zoomOpen(button,action){
 if(opening)return;opening=true;
 try{
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
   const animation=button.querySelector('.cover').animate([{transform:'scale(1)',filter:'blur(0)',opacity:1},{transform:'scale(1.35)',filter:'blur(7px)',opacity:0}],{duration:280,easing:'ease-in',fill:'forwards'});
   await animation.finished;await action();animation.cancel();
  }else await action();
 }finally{opening=false;}
}
function readPdf(id){
 pdfs=files.filter(f=>f.mimeType==='application/pdf');pdfIndex=pdfs.findIndex(f=>f.id===id);
 if(pdfIndex<0)return;
 $('#pdf-reader').showModal();document.body.style.overflow='hidden';paintPdf();
}
function paintPdf(){
 const file=pdfs[pdfIndex];
 const base=`https://drive.google.com/file/d/${encodeURIComponent(file.id)}`;
 const resource=file.resourceKey?'?resourcekey='+encodeURIComponent(file.resourceKey):'';
 $('#pdf-title').textContent=file.name;
 $('#pdf-frame').src=base+'/preview'+resource;
 $('#pdf-external').href=base+'/view'+resource;
 $('#pdf-position').textContent=`Tập ${pdfIndex+1} / ${pdfs.length}`;
 $('#pdf-prev').disabled=pdfIndex===0;
 $('#pdf-next').disabled=pdfIndex===pdfs.length-1;
 $('#pdf-back').hidden=pdfIndex!==pdfs.length-1;
 localStorage.setItem('jj-pdf-'+trail.at(-1).id,file.id);saveLibrary();
}
$('#pdf-prev').onclick=()=>{if(pdfIndex>0){pdfIndex--;paintPdf()}};
$('#pdf-next').onclick=()=>{if(pdfIndex<pdfs.length-1){pdfIndex++;paintPdf()}};
$('#pdf-close').onclick=$('#pdf-back').onclick=()=>$('#pdf-reader').close();
$('#pdf-reader').onclose=()=>{$('#pdf-frame').src='about:blank';document.body.style.overflow='';saveLibrary();};
function read(images){pages=images;spread=Math.min(Math.floor((pages.length-1)/2),Math.max(0,Number(localStorage.getItem('jj-position-'+trail.at(-1).id))||0));$('#title').textContent=trail.at(-1).name;$('#jump').max=Math.floor((pages.length-1)/2);$('#reader').showModal();document.body.style.overflow='hidden';paint();saveLibrary();}
function paint(){const start=spread*2;$('#spread').innerHTML=[pages[start],pages[start+1]].map(f=>f?`<div class="page"><img src="${img(f)}" alt="${esc(f.name)}"><div class="failed" hidden>Ảnh chưa tải được<br><button class="retry">Thử lại</button><a href="https://drive.google.com/file/d/${f.id}/view" target="_blank" rel="noopener">Mở trên Drive ↗</a></div></div>`:'<div class="page blank">Hết album</div>').join('');$('#spread').querySelectorAll('img').forEach(el=>{el.onerror=()=>{el.hidden=true;el.nextElementSibling.hidden=false;};el.nextElementSibling.querySelector('button').onclick=()=>{el.hidden=false;el.nextElementSibling.hidden=true;el.src=el.src+'&retry='+Date.now();};});$('#position').textContent=`Trang ${start+1}–${Math.min(start+2,pages.length)} / ${pages.length}`;$('#prev').disabled=spread===0;$('#next').disabled=start+2>=pages.length;$('#jump').value=spread;localStorage.setItem('jj-position-'+trail.at(-1).id,spread);pages.slice(start+2,start+4).forEach(f=>{const i=new Image();i.src=img(f)});}
function turn(n){const next=Math.max(0,Math.min(Math.floor((pages.length-1)/2),spread+n));if(next!==spread){spread=next;paint();}}
$('#source').onsubmit=async e=>{e.preventDefault();const m=$('#link').value.match(/\/folders\/([\w-]+)/);if(!m){$('#status').textContent='Hãy nhập link thư mục Google Drive hợp lệ.';return;}++coverEpoch;coverAbort?.abort();++request;coverScope=m[1];coverRevision=String(Date.now());savedCovers={};folderCache.clear();localStorage.setItem('jj-covers-'+coverScope,JSON.stringify({revision:coverRevision,files:{}}));coversEnabled=true;$('#filter').value='';openFolder(m[1],m[1]===ROOT?'Truyện Tranh':'Thư viện Drive',true);};$('#page-size').value=pageSize;$('#page-size').onchange=e=>{pageSize=+e.target.value;shelfPage=0;render()};$('#filter').oninput=()=>{shelfPage=0;render()};$('#shelf-prev').onclick=()=>{shelfPage--;render()};$('#shelf-next').onclick=()=>{shelfPage++;render()};$('#prev').onclick=()=>turn(-1);$('#next').onclick=()=>turn(1);$('#jump').oninput=e=>{spread=+e.target.value;paint()};$('#close').onclick=()=>$('#reader').close();$('#reader').onclose=()=>{document.body.style.overflow='';saveLibrary();if(document.fullscreenElement)document.exitFullscreen();};$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('#reader').requestFullscreen();}catch{}};document.addEventListener('keydown',e=>{if(!$('#reader').open||e.target.tagName==='INPUT')return;if(e.key==='ArrowLeft'){e.preventDefault();turn(-1)}if(e.key==='ArrowRight'){e.preventDefault();turn(1)}});let touch;$('#spread').addEventListener('touchstart',e=>{if(e.touches.length===1)touch={x:e.touches[0].clientX,y:e.touches[0].clientY};else touch=null},{passive:true});$('#spread').addEventListener('touchend',e=>{if(!touch)return;const dx=e.changedTouches[0].clientX-touch.x,dy=e.changedTouches[0].clientY-touch.y;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5)turn(dx<0?1:-1);touch=null},{passive:true});$('#settings').onclick=()=>{$('#apikey').value=key;$('#config').showModal()};$('#cancelkey').onclick=()=>$('#config').close();$('#savekey').onclick=()=>{key=$('#apikey').value.trim();folderCache.clear();localStorage.setItem('jj-api-key',key);$('#config').close();const f=trail.at(-1);if(f){trail.pop();openFolder(f.id,f.name)}};
restoreCoverCache(resume?.trail?.[0]?.id||ROOT);
if(Array.isArray(resume?.trail)&&resume.trail.length&&resume.trail.every(f=>typeof f.id==='string'&&typeof f.name==='string')){const target=resume.trail.at(-1);trail=resume.trail.slice(0,-1);$('#link').value=resume.link||$('#link').value;$('#filter').value=resume.query||'';openFolder(target.id,target.name,false,{...resume,readerOpen:false,pdfOpen:false});}else openFolder(ROOT,'Truyện Tranh',true);
