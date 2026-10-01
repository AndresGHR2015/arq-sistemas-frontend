'use client';
import { createContext, useContext, useState, useSyncExternalStore, type ReactNode } from 'react';
import { getIdentity, getSessionVersion, hasSession, listFiles, listGroups, listProjects, subscribeSession } from '@/lib/api';
import { useRemote } from '@/hooks/use-remote';

function useStoreValue() {
 const authenticated=hasSession();
 const [revision,setRevision]=useState(0);
 const identity=useRemote(getIdentity,authenticated);
 const projects=useRemote(listProjects,authenticated,revision);
 const groups=useRemote(listGroups,authenticated,revision);
 const files=useRemote(listFiles,authenticated,revision);
 return {authenticated,identity,projects,groups,files,revision,refresh:()=>setRevision(n=>n+1)};
}
const Store=createContext<ReturnType<typeof useStoreValue>|null>(null);
function SessionStore({children}:{children:ReactNode}) {const store=useStoreValue();return <Store.Provider value={store}>{children}</Store.Provider>;}
const serverSessionVersion=()=>0;
export function WorkspaceProvider({children}:{children:ReactNode}) {
 const version=useSyncExternalStore(subscribeSession,getSessionVersion,serverSessionVersion);
 return <SessionStore key={version}>{children}</SessionStore>;
}
export function useWorkspace() {const value=useContext(Store);if(!value)throw new Error('Workspace context missing');return value;}
