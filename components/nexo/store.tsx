'use client';
import { createId } from './id';
import { createContext, useContext, useState, type ReactNode } from 'react';
import { initialProjects, initialGroups, initialResources, initialTasks, initialThreads, initialActivity, type Role, type Project, type Group, type Resource, type Task, type Thread, type Activity } from './data';
function useStoreValue() {
 const [projects,setProjects]=useState<Project[]>(initialProjects);
 const [groups,setGroups]=useState<Group[]>(initialGroups);
 const [resources,setResources]=useState<Resource[]>(initialResources);
 const [tasks,setTasks]=useState<Task[]>(initialTasks);
 const [threads,setThreads]=useState<Thread[]>(initialThreads);
 const [activity,setActivity]=useState<Activity[]>(initialActivity);
 const [role,setRole]=useState<Role>('Administrador');
 const canEdit=role!=='Lector'; const canManage=role==='Administrador';
 function log(projectId:string,action:string,target:string) { setActivity(a=>[{id:createId(),projectId,author:'Tú',initials:'AH',color:'purple',action,target,date:'Ahora'},...a]); }
 return {projects,setProjects,groups,setGroups,resources,setResources,tasks,setTasks,threads,setThreads,activity,setActivity,role,setRole,canEdit,canManage,log};
}
const Store=createContext<ReturnType<typeof useStoreValue>|null>(null);
export function WorkspaceProvider({children}:{children:ReactNode}) {const store=useStoreValue();return <Store.Provider value={store}>{children}</Store.Provider>;}
export function useWorkspace() {const value=useContext(Store);if(!value)throw new Error('Workspace context missing');return value;}
