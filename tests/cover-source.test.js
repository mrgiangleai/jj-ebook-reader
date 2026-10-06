import assert from 'node:assert/strict';
import {findCover} from '../src/cover-source.js';
const folder=(id,name=id)=>({id,name,mimeType:'application/vnd.google-apps.folder'});
const image=(id)=>({id,name:id,mimeType:'image/jpeg'});
const calls=[];
const data={root:[folder('10'),folder('2'),folder('1')],1:[folder('empty')],empty:[],2:[folder('broken'),folder('deep')],deep:[image('page1')],10:[image('later')]};
const options={list:async id=>{calls.push(id);if(id==='broken')throw Error('unavailable');return {files:data[id]};},sort:a=>a.sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true})),active:()=>true};
assert.equal((await findCover(folder('root'),options)).id,'later');
assert.ok(calls.includes('1')&&calls.includes('2')&&calls.includes('10'));
let active=true;
assert.equal(await findCover(folder('root'),{...options,active:()=>active,list:async()=>{active=false;return {files:[image('page1')]};}}),null);
assert.equal(await findCover(folder('cycle'),{...options,list:async()=>({files:[folder('cycle')]})}),null);
assert.equal((await findCover({id:'pdf',mimeType:'application/pdf'},options)).id,'pdf');
console.log('PASS: empty branches, natural order, unavailable folder, cancellation, cycle, PDF');
const rejected=[];
const result=await findCover({...folder('root'),coverFile:image('hint')},{...options,accept:async file=>{rejected.push(file.id);return file.id==='later';}});
assert.equal(result.id,'later');assert.equal(rejected[0],'hint');assert.ok(rejected.includes('later'));
console.log('PASS: failed image candidates continue to the next folder until an image loads');

// A deep winner returns while other branches are still blocked, and aborts them.
let inflight=0,peak=0,aborted=0;
const started=[];
const race=await findCover(folder('race'),{...options,list:async(id,{signal})=>{
 started.push(id);
 if(id==='race')return {files:Array.from({length:6},(_,i)=>folder('branch'+i))};
 inflight++;peak=Math.max(peak,inflight);
 if(id==='branch0'||id==='deep-win'){
  inflight--;return {files:id==='branch0'?[folder('deep-win')]:[image('winner')]};
 }
 return new Promise((resolve,reject)=>signal.addEventListener('abort',()=>{inflight--;aborted++;reject(Error('aborted'));},{once:true}));
},accept:async file=>file.id==='winner'});
assert.equal(race.id,'winner');assert.ok(peak<=4);assert.equal(aborted,3);
assert.ok(started.includes('deep-win'));assert.ok(!started.includes('branch5'));
// Failure continues through nested folders and invalid candidates.
const deep=await findCover(folder('root'),{...options,accept:async file=>file.id==='page1'});
assert.equal(deep.id,'page1');
// Parallel image probes receive cancellation scoped to this cover.
let cancelledProbe=false;
const probes=await findCover(folder('probes'),{...options,list:async id=>({files:id==='probes'?[folder('slow'),folder('fast')]:[image(id)]}),accept:async(file,signal)=>{
 if(file.id==='fast')return true;
 return new Promise(resolve=>signal.addEventListener('abort',()=>{cancelledProbe=true;resolve(false);},{once:true}));
}});
assert.equal(probes.id,'fast');assert.equal(cancelledProbe,true);
console.log('PASS: four-branch limit, deep search, immediate winner, remaining requests/probes aborted');
