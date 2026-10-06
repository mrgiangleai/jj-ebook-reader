const CACHE='jj-cover-images-v1';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(url.hostname!=='drive.google.com'||url.pathname!=='/thumbnail'||url.searchParams.get('sz')!=='w150'||!url.searchParams.has('jjcover'))return;
 event.respondWith((async()=>{
  const only=url.searchParams.has('jjcached');url.searchParams.delete('jjcached');
  const cache=await caches.open(CACHE),cached=await cache.match(url.href);
  if(cached)return cached;
  if(only)return Response.error();
  const response=await fetch(new Request(url.href,{mode:'no-cors',credentials:'omit',cache:'reload'}));
  if(response.ok||response.type==='opaque'){try{await cache.put(url.href,response.clone());}catch{}}
  return response;
 })());
});
