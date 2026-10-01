import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { readFileSync } from 'node:fs';
const source = ts.transpileModule(readFileSync(new URL('../lib/api.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const client = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
test('login, bearer, shared refresh, errors and logout',async()=>{
 const original=globalThis.fetch;
 try {
  globalThis.fetch=async(url,options)=>{assert.equal(url,'/api/token/');assert.deepEqual(JSON.parse(options.body),{username:'andres',password:'test'});return reply({access:'old',refresh:'refresh'});};
  await client.login('andres','test');assert.equal(client.hasSession(),true);
  let refreshCalls=0;
  globalThis.fetch=async(url,options)=>{
   if(url==='/api/token/refresh/'){refreshCalls++;assert.equal(JSON.parse(options.body).refresh,'refresh');return reply({access:'new'});}
   assert.equal(url,'/api/archivos/');
   if(options.headers.Authorization==='Bearer old')return reply({},401);
   assert.equal(options.headers.Authorization,'Bearer new');return reply([{id:1,nombre_original:'Partitura.pdf'}]);
  };
  const results=await Promise.all([client.listFiles(),client.listFiles()]);assert.equal(refreshCalls,1);assert.equal(results[0][0].nombre_original,'Partitura.pdf');
  globalThis.fetch=async()=>reply({},403);await assert.rejects(client.listFiles(),e=>e.status===403);
  globalThis.fetch=async()=>reply({},401);await assert.rejects(client.listFiles(),e=>e.status===401);assert.equal(client.hasSession(),false);
  await assert.rejects(client.listFiles(),e=>e.status===401);
  globalThis.fetch=async()=>reply({},401);await assert.rejects(client.login('bad','bad'),e=>e.status===401);assert.equal(client.hasSession(),false);
 }finally{globalThis.fetch=original;client.logout();}
});

test('session changes invalidate account state and reject a late file response',async()=>{
 const original=globalThis.fetch;
 const notifications=[];
 const unsubscribe=client.subscribeSession(()=>notifications.push({version:client.getSessionVersion(),authenticated:client.hasSession()}));
 try {
  const initial=client.getSessionVersion();
  globalThis.fetch=async()=>reply({access:'account-a',refresh:'refresh-a'});
  await client.login('a','test');
  assert.deepEqual(notifications.map(n=>n.authenticated),[false,true]);
  assert.ok(notifications[1].version>initial);
  let finish;
  globalThis.fetch=()=>new Promise(resolve=>{finish=resolve;});
  const pending=client.listFiles();
  client.logout();
  assert.equal(notifications.at(-1).authenticated,false);
  globalThis.fetch=async()=>reply({access:'account-b',refresh:'refresh-b'});
  await client.login('b','test');
  finish(reply([{id:99,nombre_original:'Solo cuenta A'}]));
  await assert.rejects(pending,error=>error.status===401);
  assert.equal(client.hasSession(),true);
  globalThis.fetch=async()=>reply({},401);
  await assert.rejects(client.listFiles(),error=>error.status===401);
  assert.equal(notifications.at(-1).authenticated,false);
  unsubscribe();
  const count=notifications.length;
  client.logout();
  assert.equal(notifications.length,count);
 }finally{unsubscribe();globalThis.fetch=original;client.logout();}
});

test('workspace contracts preserve server permissions, relations and validation errors',async()=>{
 const original=globalThis.fetch;
 try {
  globalThis.fetch=async()=>reply({access:'session',refresh:'refresh'});
  await client.login('member','test');
  const project={id:4,nombre:'Ensayo',descripcion:'Plan',equipos:[7,8],permissions:{edit:true,delete:true,manage_teams:true,upload_files:true}};
  globalThis.fetch=async(url,options)=>{
   assert.equal(options.headers.Authorization,'Bearer session');
   assert.equal(options.cache,'no-store');
   if(url==='/api/me/')return reply({id:3,username:'member',permissions:{create_project:true,create_group:true}});
   if(url==='/api/proyectos/'&&options.method==='POST'){
    assert.deepEqual(JSON.parse(options.body),{nombre:'Ensayo',descripcion:'Plan',equipo:7});
    return reply(project,201);
   }
   if(url==='/api/proyectos/')return reply({results:[project]});
   if(url==='/api/equipos/'&&options.method==='POST'){
    assert.deepEqual(JSON.parse(options.body),{nombre:'Banda',equipo_recurrente:true});
    return reply({id:7,nombre:'Banda',equipo_recurrente:true,usuarios:[3],permissions:{edit:true,delete:true,manage_members:true}},201);
   }
   if(url==='/api/equipos/7/miembros/'&&options.method==='POST'){
    assert.deepEqual(JSON.parse(options.body),{usuario:9,rol:'Músico'});
    return reply({usuario:['Ese usuario ya pertenece al equipo.']},400);
   }
   if(url==='/api/proyectos/4/equipos/8/'){
    assert.equal(options.method,'DELETE');return new Response(null,{status:204});
   }
   throw new Error(`Unexpected request ${url}`);
  };
  assert.equal((await client.getIdentity()).username,'member');
  assert.deepEqual(await client.createProject({nombre:'Ensayo',descripcion:'Plan',equipo:7}),project);
  assert.deepEqual(await client.listProjects(),[project]);
  assert.equal((await client.createGroup({nombre:'Banda',equipo_recurrente:true})).usuarios[0],3);
  await assert.rejects(client.addMember(7,9,'Músico'),error=>error.status===400&&error.fields.usuario[0]==='Ese usuario ya pertenece al equipo.');
  assert.equal(await client.removeGroupAssociation(4,8),undefined);
 }finally{globalThis.fetch=original;client.logout();}
});

test('file uploads use multipart and downloads renew auth without exposing media URLs',async()=>{
 const original=globalThis.fetch;
 try {
  globalThis.fetch=async()=>reply({access:'old',refresh:'refresh'});await client.login('member','test');
  const file=new File(['contenido real'],'ensayo.txt',{type:'text/plain'});
  let refreshes=0;
  globalThis.fetch=async(url,options)=>{
   if(url==='/api/archivos/'&&options.method==='POST'){
    assert.ok(options.body instanceof FormData);
    assert.equal(options.headers['Content-Type'],undefined);
    assert.equal(options.body.get('archivo').name,'ensayo.txt');
    assert.equal(options.body.get('proyecto'),'4');
    assert.equal(options.body.get('global'),'false');
    assert.equal(options.body.get('categoria'),'Ensayos');
    return reply({id:12,nombre_original:'ensayo.txt'},201);
   }
   if(url==='/api/token/refresh/'){refreshes++;return reply({access:'new'});}
   assert.equal(url,'/api/archivos/12/download/');
   assert.equal(options.headers.Authorization,refreshes?'Bearer new':'Bearer old');
   if(!refreshes)return reply({},401);
   return new Response('contenido real',{headers:{'Content-Type':'text/plain'}});
  };
  assert.equal((await client.uploadFile(4,file,'Ensayos',false)).id,12);
  assert.equal(await (await client.downloadFile(12)).text(),'contenido real');
  assert.equal(refreshes,1);
 }finally{globalThis.fetch=original;client.logout();}
});

test('a body completing after logout is not returned to the next account',async()=>{
 const original=globalThis.fetch;
 try {
  globalThis.fetch=async()=>reply({access:'a',refresh:'r'});await client.login('a','test');
  let completeBody;
  let started;
  const bodyStarted=new Promise(resolve=>{started=resolve;});
  globalThis.fetch=async()=>({ok:true,status:200,blob:()=>{started();return new Promise(resolve=>{completeBody=resolve;});}});
  const pending=client.downloadFile(12);
  await bodyStarted;
  client.logout();
  completeBody(new Blob(['secret from a']));
  await assert.rejects(pending,error=>error.status===401);
 }finally{globalThis.fetch=original;client.logout();}
});

test('a delayed refresh body cannot overwrite a new login',async()=>{
 const original=globalThis.fetch;
 try {
  globalThis.fetch=async()=>reply({access:'old',refresh:'old-refresh'});await client.login('old','test');
  let resolveRefresh;
  let started;
  const refreshStarted=new Promise(resolve=>{started=resolve;});
  globalThis.fetch=async url=>url==='/api/token/refresh/'?{ok:true,json:()=>{started();return new Promise(resolve=>{resolveRefresh=resolve;});}}:reply({},401);
  const pending=client.listProjects();await refreshStarted;
  globalThis.fetch=async()=>reply({access:'new-account',refresh:'new-refresh'});await client.login('new','test');
  resolveRefresh({access:'obsolete'});
  await assert.rejects(pending,error=>error.status===401);
  globalThis.fetch=async(url,options)=>{assert.equal(options.headers.Authorization,'Bearer new-account');return reply([]);};
  assert.deepEqual(await client.listProjects(),[]);
 }finally{globalThis.fetch=original;client.logout();}
});
