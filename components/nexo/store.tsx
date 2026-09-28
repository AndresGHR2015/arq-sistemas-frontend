'use client';
import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { ApiError, getSessionVersion, hasSession, listFiles, logout, subscribeSession, type ArchivoDTO } from '@/lib/api';
import type { Role, Project, Group, Resource, Task, Thread, Activity } from './data';

type FileState = 'loading' | 'ready' | 'offline' | 'denied' | 'error';
function useStoreValue() {
 const authenticated=hasSession();
 const [projects,setProjects]=useState<Project[]>([]);
 const [groups,setGroups]=useState<Group[]>([]);
 const [resources,setResources]=useState<Resource[]>([]);
 const [tasks,setTasks]=useState<Task[]>([]);
 const [threads,setThreads]=useState<Thread[]>([]);
 const [activity,setActivity]=useState<Activity[]>([]);
 const [files,setFiles]=useState<ArchivoDTO[]>([]);
 const [fileState,setFileState]=useState<FileState>('loading');
 const [attempt,setAttempt]=useState(0);
 useEffect(()=>{
  if(!authenticated)return;
  let active=true;
  setFiles([]);setFileState('loading');
  listFiles().then(data=>{if(active){setFiles(data);setFileState('ready');}}).catch(error=>{
   if(!active)return;
   if(error instanceof ApiError&&error.status===401){logout();return;}
   setFileState(error instanceof ApiError&&error.status===403?'denied':error instanceof ApiError&&error.status===0?'offline':'error');
  });
  return()=>{active=false;};
 },[authenticated,attempt]);
 // The current API does not expose workspace collections or effective roles.
 const role:Role|null=null;
 const canEdit=false;const canManage=false;
 function log(_projectId:string,_action:string,_target:string) {}
 return {authenticated,projects,setProjects,groups,setGroups,resources,setResources,tasks,setTasks,threads,setThreads,activity,setActivity,role,canEdit,canManage,log,files,fileState,retryFiles:()=>setAttempt(n=>n+1)};
}
const Store=createContext<ReturnType<typeof useStoreValue>|null>(null);
function SessionStore({children}:{children:ReactNode}) {const store=useStoreValue();return <Store.Provider value={store}>{children}</Store.Provider>;}
const serverSessionVersion=()=>0;
export function WorkspaceProvider({children}:{children:ReactNode}) {
 const version=useSyncExternalStore(subscribeSession,getSessionVersion,serverSessionVersion);
 return <SessionStore key={version}>{children}</SessionStore>;
}
export function useWorkspace() {const value=useContext(Store);if(!value)throw new Error('Workspace context missing');return value;}
