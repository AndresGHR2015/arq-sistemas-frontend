'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { login } from '@/lib/api';
export default function LoginPage() {
 const router=useRouter(); const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();if(busy)return;const data=new FormData(e.currentTarget);setBusy(true);setError('');try{await login(String(data.get('username')).trim(),String(data.get('password')));router.replace('/proyectos');}catch(e){setError(e instanceof Error?e.message:'No se pudo iniciar sesión.');}finally{setBusy(false);}}
  return <main className="auth-shell"><section className="auth-story"><Link href="/login" className="brand"><img src="/favicon.svg" alt="" className="brand-logo"/>nexo.</Link><div><span className="auth-eyebrow">TU ESPACIO COMPARTIDO</span><h1>Todo lo que construyen,<br/>en un mismo lugar.</h1><p>Proyectos, archivos e ideas. Un espacio para volver a encontrarse y seguir creando.</p></div><p>Del primer apunte al próximo gran proyecto.</p></section><section className="auth-form-side"><div className="auth-card"><LockKeyhole size={26}/><h2>Bienvenido de nuevo</h2><p>Inicia sesión con tu cuenta para continuar.</p><form onSubmit={submit}><label htmlFor="username">Nombre de usuario</label><Input id="username" name="username" autoComplete="username" required disabled={busy}/><label htmlFor="password">Contraseña</label><Input id="password" name="password" type="password" autoComplete="current-password" required disabled={busy}/>{error&&<p role="alert" className="auth-error">{error}</p>}<Button type="submit" disabled={busy}>{busy?'Entrando…':'Iniciar sesión'}<ArrowRight size={16}/></Button></form></div></section></main>;
}
