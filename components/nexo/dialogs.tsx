'use client';
import { useState, useCallback, useRef, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Plus, LockKeyhole, Copy, Users, X, FileText, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { createProject, createGroup, updateProject, updateGroup, deleteProject, deleteGroup, getSessionVersion, uploadFile, listProjectGroups, listMembers, associateGroup, removeGroupAssociation, addMember, removeMember, type ProjectDTO, type GroupDTO } from '@/lib/api';
import { useRemote } from '@/hooks/use-remote';
import { useWorkspace } from './store';
import { Avatar, Choice } from './ui';
import { RemoteState, FormError, asError, initials, colorFor } from './remote-state';

export type CreateMode='project'|'group'|'file';
type UploadEntry={file:File;status:'pending'|'uploading'|'done'|'error';error?:Error};
export function CreateDialog({mode,onClose,project,groupId}:{mode:CreateMode;onClose:()=>void;project?:ProjectDTO;groupId?:number}) {
 const s=useWorkspace();const router=useRouter();const inputRef=useRef<HTMLInputElement>(null);
 const [title,setTitle]=useState('');const [body,setBody]=useState('');const [group,setGroup]=useState(groupId?String(groupId):'personal');
 const [recurrent,setRecurrent]=useState(false);const [category,setCategory]=useState('');const [projectWide,setProjectWide]=useState(false);
 const [entries,setEntries]=useState<UploadEntry[]>([]);const [busy,setBusy]=useState(false);const [drag,setDrag]=useState(false);const [error,setError]=useState<Error|null>(null);
 const permitted=mode==='project'?s.identity.data?.permissions.create_project:mode==='group'?s.identity.data?.permissions.create_group:project?.permissions.upload_files;
 const labels={project:['Un nuevo proyecto','Dale un lugar a lo que quieres construir.','Crear proyecto'],group:['Crea tu grupo','Reúne a las personas con las que trabajas una y otra vez.','Crear grupo'],file:['Añadir archivos','Documentos e imágenes, en un mismo lugar.','Añadir archivos']}[mode];
 function chooseFiles(incoming:FileList|null){if(incoming&&!busy)setEntries(prev=>[...prev,...Array.from(incoming).map(file=>({file,status:'pending' as const}))]);}
 async function submit(event:FormEvent){
  event.preventDefault();if(busy||!permitted)return;const session=getSessionVersion();setBusy(true);setError(null);
  try{
   if(mode==='project'){
    const result=await createProject({nombre:title.trim(),descripcion:body.trim(),...(group==='personal'?{}:{equipo:Number(group)})});
    s.refresh();onClose();router.push(`/proyectos/${result.id}`);toast.success('Proyecto creado');
   }else if(mode==='group'){
    const result=await createGroup({nombre:title.trim(),equipo_recurrente:recurrent});
    s.refresh();onClose();router.push(`/grupos/${result.id}`);toast.success('Grupo creado');
   }else if(project){
    let failed=false;
    for(let index=0;index<entries.length;index++){
     if(session!==getSessionVersion())return;
     const entry=entries[index];if(entry.status==='done')continue;
     setEntries(all=>all.map((item,i)=>i===index?{...item,status:'uploading',error:undefined}:item));
     try{await uploadFile(project.id,entry.file,category.trim(),projectWide);setEntries(all=>all.map((item,i)=>i===index?{...item,status:'done'}:item));}
     catch(cause){failed=true;setEntries(all=>all.map((item,i)=>i===index?{...item,status:'error',error:asError(cause)}:item));}
    }
    if(session!==getSessionVersion())return;
    s.files.retry();if(!failed){onClose();toast.success('Archivos guardados');}
   }
  }catch(cause){setError(asError(cause));}finally{setBusy(false);}
 }
 return <Dialog open onOpenChange={open=>{if(!open&&!busy)onClose();}}><DialogContent className="nexo-dialog"><DialogHeader><DialogTitle>{labels[0]}</DialogTitle><DialogDescription>{labels[1]}</DialogDescription></DialogHeader><form onSubmit={submit}>
  {!permitted&&<p className="form-note" role="status"><Info size={13}/>No está disponible esta acción para tu cuenta.</p>}
  {mode==='file'?<><div className={`drop-zone ${drag?'dragging':''}`} onDragOver={event=>{event.preventDefault();if(!busy)setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={event=>{event.preventDefault();setDrag(false);chooseFiles(event.dataTransfer.files);}}><Upload size={30} strokeWidth={1.4}/><strong>Arrastra tus archivos aquí</strong><span>o elígelos desde tu dispositivo</span><Button type="button" variant="outline" disabled={busy} onClick={()=>inputRef.current?.click()}>Seleccionar archivos</Button><input ref={inputRef} type="file" multiple hidden onChange={event=>{chooseFiles(event.target.files);event.target.value='';}}/></div>{entries.map((entry,index)=><div key={index}><div className="selected-file"><FileText size={15}/><span className="flex-1 truncate">{entry.file.name}</span><span role="status">{entry.status==='done'?'Guardado':entry.status==='uploading'?'Subiendo…':entry.status==='error'?'No guardado':''}</span>{entry.status!=='done'&&<Button type="button" variant="ghost" size="icon" disabled={busy} aria-label={`Quitar ${entry.file.name}`} onClick={()=>setEntries(all=>all.filter((_,i)=>i!==index))}><X size={14}/></Button>}</div>{entry.error&&<FormError error={entry.error}/>}</div>)}<div className="form-field"><label htmlFor="create-category">Categoría (opcional)</label><Input id="create-category" value={category} onChange={event=>setCategory(event.target.value)} maxLength={100} disabled={busy}/></div><VisibilityChoice value={projectWide} onChange={setProjectWide} disabled={busy}/></>:<div className="form-field"><label htmlFor="create-title">{mode==='group'?'Nombre del grupo':'Nombre del proyecto'}</label><Input id="create-title" value={title} onChange={event=>setTitle(event.target.value)} required maxLength={255} disabled={busy} placeholder={mode==='project'?'Por ejemplo, nuestro próximo concierto':'Por ejemplo, Banda Norte'} autoFocus/></div>}
  {mode==='project'&&<><div className="form-field"><label>Ubicación</label><fieldset disabled={busy}><Choice value={group} onChange={setGroup} label="Ubicación del proyecto" items={[{value:'personal',label:'Nuevo equipo principal'},...(s.groups.data||[]).map(item=>({value:String(item.id),label:item.nombre}))]}/></fieldset><p className="small-caption">Se creará un equipo principal contigo. Si eliges otro grupo, también tendrá acceso al proyecto.</p>{s.groups.status==='error'&&<RemoteState state={s.groups} label="grupos"/>}</div><div className="form-field"><label htmlFor="create-body">Descripción (opcional)</label><Textarea id="create-body" value={body} onChange={event=>setBody(event.target.value)} rows={3} disabled={busy} placeholder="Un poco de contexto para el equipo…"/></div></>}
  {mode==='group'&&<div className="form-field"><label className="flex items-center gap-2"><input type="checkbox" checked={recurrent} onChange={event=>setRecurrent(event.target.checked)} disabled={busy}/>Grupo recurrente</label><p className="small-caption">Un equipo con el que trabajas de forma habitual.</p></div>}
  <FormError error={error}/><div className="dialog-actions"><Button type="button" variant="outline" onClick={onClose} disabled={busy}>Cancelar</Button><Button type="submit" disabled={busy||!permitted||(mode==='file'?!entries.some(entry=>entry.status!=='done'):!title.trim())}>{busy?'Guardando…':entries.some(entry=>entry.status==='error')?'Reintentar pendientes':labels[2]}</Button></div>
 </form></DialogContent></Dialog>;
}
export function VisibilityChoice({value,onChange,disabled=false}:{value:boolean;onChange:(value:boolean)=>void;disabled?:boolean}) {
 return <div className="form-field"><label className="flex items-center gap-2"><input type="checkbox" checked={value} onChange={event=>onChange(event.target.checked)} disabled={disabled}/>Visible para todos los equipos del proyecto</label><p className="small-caption">Si no lo marcas, solo podrán verlo quienes compartan un equipo del proyecto con la persona que subió el archivo. Nunca será público.</p></div>;
}
export function EditSpaceDialog({space,onClose}:{space:{kind:'project';data:ProjectDTO}|{kind:'group';data:GroupDTO};onClose:()=>void}) {
 const s=useWorkspace();const router=useRouter();const [name,setName]=useState(space.data.nombre);const [description,setDescription]=useState(space.kind==='project'?space.data.descripcion||'':'');const [recurrent,setRecurrent]=useState(space.kind==='group'?space.data.equipo_recurrente:false);const [busy,setBusy]=useState(false);const [error,setError]=useState<Error|null>(null);
 async function save(event:FormEvent){event.preventDefault();if(busy||!space.data.permissions.edit)return;setBusy(true);setError(null);try{if(space.kind==='project')await updateProject(space.data.id,{nombre:name.trim(),descripcion:description.trim()});else await updateGroup(space.data.id,{nombre:name.trim(),equipo_recurrente:recurrent});s.refresh();onClose();toast.success('Cambios guardados');}catch(cause){setError(asError(cause));}finally{setBusy(false);}}
 async function remove(){if(busy||!space.data.permissions.delete)return;setBusy(true);setError(null);try{if(space.kind==='project')await deleteProject(space.data.id);else await deleteGroup(space.data.id);s.refresh();onClose();router.replace(space.kind==='project'?'/proyectos':'/grupos');toast.success(space.kind==='project'?'Proyecto eliminado':'Grupo eliminado');}catch(cause){setError(asError(cause));}finally{setBusy(false);}}
 return <Dialog open onOpenChange={open=>{if(!open&&!busy)onClose();}}><DialogContent className="nexo-dialog"><DialogHeader><DialogTitle>{space.kind==='project'?'Editar proyecto':'Editar grupo'}</DialogTitle><DialogDescription>{space.data.nombre}</DialogDescription></DialogHeader><form onSubmit={save}><div className="form-field"><label htmlFor="edit-name">Nombre</label><Input id="edit-name" value={name} onChange={event=>setName(event.target.value)} required maxLength={255} disabled={busy}/></div>{space.kind==='project'?<div className="form-field"><label htmlFor="edit-description">Descripción (opcional)</label><Textarea id="edit-description" value={description} onChange={event=>setDescription(event.target.value)} disabled={busy}/></div>:<div className="form-field"><label className="flex items-center gap-2"><input type="checkbox" checked={recurrent} onChange={event=>setRecurrent(event.target.checked)} disabled={busy}/>Grupo recurrente</label></div>}<FormError error={error}/><div className="dialog-actions"><Button type="button" variant="outline" onClick={onClose} disabled={busy}>Cancelar</Button><Button type="submit" disabled={busy||!name.trim()||!space.data.permissions.edit}>{busy?'Guardando…':'Guardar cambios'}</Button></div></form>{space.data.permissions.delete&&<ConfirmAction label={space.kind==='project'?'Eliminar proyecto':'Eliminar grupo'} description={space.kind==='project'?'Se eliminarán el proyecto y sus registros de archivos para todos sus equipos. No podrás deshacerlo desde la aplicación.':'Se eliminará el grupo y sus asociaciones. Sus integrantes podrían perder el acceso a proyectos y archivos.'} disabled={busy} onConfirm={()=>void remove()}/>}</DialogContent></Dialog>;
}
export function ConfirmAction({label,description,onConfirm,disabled=false}:{label:string;description:string;onConfirm:()=>void;disabled?:boolean}) {
 return <AlertDialog><AlertDialogTrigger asChild><Button type="button" variant="outline" disabled={disabled}>{label}</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{label}</AlertDialogTitle><AlertDialogDescription>{description}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={onConfirm}>Confirmar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}
export function ShareDialog({onClose,project}:{onClose:()=>void;project:ProjectDTO}) {
 const s=useWorkspace();const load=useCallback(()=>listProjectGroups(project.id),[project.id]);const groups=useRemote(load,true,s.revision);
 const [selected,setSelected]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState<Error|null>(null);
 const available=(s.groups.data||[]).filter(group=>!groups.data?.some(item=>item.id===group.id));
 async function change(action:()=>Promise<unknown>){if(busy)return;setBusy(true);setError(null);try{await action();setSelected('');s.refresh();toast.success('Accesos actualizados');}catch(cause){setError(asError(cause));}finally{setBusy(false);}}
 return <Dialog open onOpenChange={open=>{if(!open&&!busy)onClose();}}><DialogContent className="nexo-dialog"><DialogHeader><DialogTitle>Accesos al proyecto</DialogTitle><DialogDescription>{project.nombre}</DialogDescription></DialogHeader><RemoteState state={groups} label="grupos asociados"/>
  {groups.data?.map(group=><div className="member-row" key={group.id}><span className={`group-symbol tone-${colorFor(group.id)}`}>{initials(group.nombre)}</span><div className="member-copy"><strong>{group.nombre}</strong><small>Equipo asociado al proyecto</small></div>{project.permissions.manage_teams&&<ConfirmAction label="Retirar" description="El grupo perderá el acceso concedido por esta asociación. Si es tu único grupo en el proyecto, tú también perderás el acceso." disabled={busy} onConfirm={()=>void change(()=>removeGroupAssociation(project.id,group.id))}/>}</div>)}
  {project.permissions.manage_teams&&groups.status==='ready'&&<form className="invite-row" onSubmit={event=>{event.preventDefault();if(selected)void change(()=>associateGroup(project.id,Number(selected)));}}><fieldset disabled={busy}><Choice value={selected} onChange={setSelected} label="Grupo con el que compartir" items={available.map(group=>({value:String(group.id),label:group.nombre}))}/></fieldset><Button type="submit" disabled={busy||!selected}>Compartir</Button></form>}
  <FormError error={error}/><div className="share-link-box"><LockKeyhole size={19}/><div className="flex-1"><strong>Acceso por equipos</strong><p>Copiar el enlace no cambia los permisos.</p></div><Button variant="outline" size="icon" aria-label="Copiar enlace del proyecto" onClick={()=>void navigator.clipboard.writeText(`${window.location.origin}/proyectos/${project.id}`).then(()=>toast.success('Enlace copiado')).catch(()=>toast.error('No se pudo copiar el enlace.'))}><Copy size={15}/></Button></div><p className="form-note"><Info size={13}/>Los equipos asociados pueden gestionar este proyecto según los permisos actuales del servidor.</p>
 </DialogContent></Dialog>;
}
export function GroupMembersDialog({onClose,group}:{onClose:()=>void;group:GroupDTO}) {
 const s=useWorkspace();const load=useCallback(()=>listMembers(group.id),[group.id]);const members=useRemote(load,true,s.revision);
 const [userId,setUserId]=useState('');const [role,setRole]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState<Error|null>(null);
 async function change(action:()=>Promise<unknown>){if(busy)return;setBusy(true);setError(null);try{await action();setUserId('');setRole('');s.refresh();toast.success('Integrantes actualizados');}catch(cause){setError(asError(cause));}finally{setBusy(false);}}
 return <Dialog open onOpenChange={open=>{if(!open&&!busy)onClose();}}><DialogContent className="nexo-dialog"><DialogHeader><DialogTitle>El equipo de {group.nombre}</DialogTitle><DialogDescription>Un grupo que te acompaña en más de un proyecto.</DialogDescription></DialogHeader><RemoteState state={members} label="integrantes"/>
  {group.permissions.manage_members&&<form onSubmit={event=>{event.preventDefault();const id=Number(userId);if(Number.isSafeInteger(id)&&id>0)void change(()=>addMember(group.id,id,role.trim()));}}><div className="form-field"><label htmlFor="member-id">ID del usuario</label><Input id="member-id" type="number" min={1} step={1} required value={userId} onChange={event=>setUserId(event.target.value)} disabled={busy}/></div><div className="form-field"><label htmlFor="member-role">Rol descriptivo (opcional)</label><Input id="member-role" maxLength={100} value={role} onChange={event=>setRole(event.target.value)} disabled={busy}/></div><p className="form-note"><Info size={13}/>Añade una cuenta existente por su ID. No se envía una invitación por correo. El rol es descriptivo y no cambia sus permisos.</p><Button type="submit" disabled={busy||!userId}><Plus size={15}/>Añadir</Button></form>}
  <FormError error={error}/>{members.data?.map(member=><div className="member-row" key={member.usuario}><Avatar initials={initials(member.username)} color={colorFor(member.usuario)}/><div className="member-copy"><strong>{member.username}{member.usuario===s.identity.data?.id?' (tú)':''}</strong><small>ID {member.usuario} · {member.rol||'Sin rol'}</small></div>{group.permissions.manage_members&&<ConfirmAction label="Retirar" description={member.usuario===s.identity.data?.id?'Saldrás del grupo y podrías perder el acceso a sus proyectos y archivos.':'Esta persona perderá los accesos que dependan de su pertenencia al grupo.'} disabled={busy} onConfirm={()=>void change(()=>removeMember(group.id,member.usuario))}/>}</div>)}<p className="form-note"><Users size={14}/>La pertenencia a este grupo determina el acceso a sus proyectos y archivos.</p>
 </DialogContent></Dialog>;
}
