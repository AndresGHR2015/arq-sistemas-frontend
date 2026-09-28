'use client';
import { createId } from './id';
import { useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useWorkspace } from './store';
type Tool={name:string;description:string;inputSchema:object;annotations:{readOnlyHint:boolean;untrustedContentHint:boolean};execute:(input:unknown)=>unknown};
type ModelContext={registerTool:(tool:Tool,options?:{signal?:AbortSignal})=>void|Promise<void>};
export function useWebMCP(){
 const store=useWorkspace();const current=useRef(store);current.current=store;
 useEffect(()=>{
  const context=(document as Document&{modelContext?:ModelContext}).modelContext;if(!context?.registerTool)return;
  const lifecycle=new AbortController();
  const tools:Tool[]=[
   {name:'search_workspace',description:'Search project and resource titles in the current Nexo demonstration session. Does not modify data.',inputSchema:{type:'object',properties:{query:{type:'string'}},required:['query'],additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute(input){if(!input||typeof input!=='object'||typeof (input as {query?:unknown}).query!=='string')throw new Error('query must be a string');const q=(input as {query:string}).query.toLocaleLowerCase();return {projects:current.current.projects.filter(p=>p.name.toLowerCase().includes(q)).map(p=>({id:p.id,title:p.name})),resources:current.current.resources.filter(r=>r.title.toLowerCase().includes(q)).map(r=>({id:r.id,title:r.title,projectId:r.projectId}))};}},
   {name:'create_project_note',description:'Create a note in an existing project in the current Nexo demonstration session. Changes are lost when the page reloads. Requires the same editor capability as the visible interface.',inputSchema:{type:'object',properties:{projectId:{type:'string'},title:{type:'string',minLength:1,maxLength:100},content:{type:'string',minLength:1,maxLength:15000}},required:['projectId','title','content'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},execute(input){if(!input||typeof input!=='object')throw new Error('Expected a note object');const {projectId,title,content}=input as Record<string,unknown>;if(typeof projectId!=='string'||typeof title!=='string'||!title.trim()||title.length>100||typeof content!=='string'||!content.trim()||content.length>15000)throw new Error('Invalid note fields');const s=current.current;if(!s.canEdit)throw new Error('Current role cannot create notes');if(!s.projects.some(p=>p.id===projectId))throw new Error('Project not found');const id=createId();flushSync(()=>{s.setResources(rs=>[{id,projectId,title:title.trim(),kind:'note',folder:'Notas',author:'Andrés Hidalgo',initials:'AH',color:'purple',date:'Ahora',version:1,size:'Nota',content,comments:[]},...rs]);s.log(projectId,'añadió',title.trim());});return {id,projectId,title:title.trim(),status:'created_in_demo_session'};}}
  ];
  for(const tool of tools){try{void Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
  return()=>lifecycle.abort();
 },[]);
}
