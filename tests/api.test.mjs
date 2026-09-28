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
