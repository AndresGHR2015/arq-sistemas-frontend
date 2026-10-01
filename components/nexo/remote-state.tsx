'use client';
import { ApiError } from '@/lib/api';
import type { Remote } from '@/hooks/use-remote';
import { Button } from '@/components/ui/button';
import { EmptyView } from './ui';

export function RemoteState({state,label}:{state:Remote<unknown>&{retry:()=>void};label:string}) {
 if(state.status==='loading')return <p role="status">Cargando {label}…</p>;
 if(state.status!=='error')return null;
 const status=state.error instanceof ApiError?state.error.status:0;
 return <div role="alert"><EmptyView title={status===403?'Acceso denegado':status===404?'Elemento no disponible':status===0?'Sin conexión':`No pudimos cargar ${label}`} description={state.error?.message||'Inténtalo de nuevo más tarde.'}/><Button variant="outline" onClick={state.retry}>Reintentar</Button></div>;
}
export function FormError({error}:{error:Error|null}) {
 if(!error)return null;
 const labels:Record<string,string>={nombre:'Nombre',descripcion:'Descripción',equipo:'Grupo',usuario:'Usuario',rol:'Rol',archivo:'Archivo',categoria:'Categoría',nombre_original:'Nombre',proyecto:'Proyecto',global:'Visibilidad',equipo_recurrente:'Grupo recurrente'};
 return <div role="alert" className="auth-error"><p>{error.message}</p>{error instanceof ApiError&&Object.entries(error.fields).map(([field,messages])=>messages.length>0&&<p key={field}>{labels[field]?`${labels[field]}: `:''}{messages.join(' ')}</p>)}</div>;
}
export const asError=(error:unknown)=>error instanceof Error?error:new Error('No se pudo completar la acción.');
export const initials=(name:string)=>name.slice(0,2).toUpperCase();
export const colorFor=(id:number)=>['purple','blue','coral','amber'][id%4];
