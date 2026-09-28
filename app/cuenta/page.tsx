'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApiError, hasSession, listFiles, logout, type ArchivoDTO } from '@/lib/api';
export default function AccountPage(){
 const router=useRouter();const [files,setFiles]=useState<ArchivoDTO[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [attempt,setAttempt]=useState(0);
 useEffect(()=>{let active=true;if(!hasSession()){router.replace('/login');return;}setLoading(true);setError('');listFiles().then(data=>{if(active)setFiles(data);}).catch(e=>{if(!active)return;if(e instanceof ApiError&&e.status===401){router.replace('/login');return;}setError(e instanceof Error?e.message:'No se pudieron cargar los archivos.');}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[router,attempt]);
 return <main className="account-page"><header><Link href="/cuenta" className="brand"><img src="/favicon.svg" alt="" className="brand-logo"/>nexo.</Link><Button variant="outline" onClick={()=>{logout();setFiles([]);router.replace('/login');}}><LogOut size={16}/>Cerrar sesión</Button></header><section><span className="auth-eyebrow">MI CUENTA</span><h1>Archivos disponibles</h1><p>Archivos que el servidor permite consultar con tu cuenta.</p>{loading?<p role="status">Cargando archivos…</p>:error?<div role="alert"><p className="auth-error">{error}</p><Button onClick={()=>setAttempt(n=>n+1)}>Reintentar</Button></div>:files.length===0?<div className="account-empty"><FileText size={32}/><h2>Todavía no hay archivos</h2><p>No hay archivos visibles para tu cuenta.</p></div>:<ul className="account-files">{files.map(file=><li key={file.id}><FileText/><div><strong>{file.nombre_original}</strong><p>Proyecto {file.proyecto} · {file.categoria||'Archivo'}</p></div><time>{new Date(file.fecha_subido).toLocaleDateString('es-CL')}</time></li>)}</ul>}<aside className="account-note"><strong>Integración inicial</strong><p>Este listado proviene del backend. Las vistas de proyectos y grupos siguen siendo una demostración independiente. La subida y descarga privada se conectarán cuando estén listos sus permisos.</p><Link href="/proyectos">Abrir la referencia visual →</Link></aside></section></main>;
}
