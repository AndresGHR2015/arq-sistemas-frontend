'use client';
import { Layers, Music2, PenTool, Sparkles, FileText, ImageIcon, Link2, Network, StickyNote, FolderOpen } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import type { Resource, ResourceKind, Member, Project } from './data';
export function Avatar({initials,color='purple',small=false}:{initials:string;color?:string;small?:boolean}) {return <span className={`avatar tone-${color} ${small?'avatar-small':''}`}>{initials}</span>;}
export function Avatars({members}:{members:Member[]}) {return <span className="avatar-stack" aria-label={members.map(m=>m.name).join(', ')}>{members.slice(0,4).map(m=><Avatar key={m.name} initials={m.initials} color={m.color} small />)}</span>;}
export function ProjectIcon({project,large=false}:{project:Pick<Project,'icon'|'color'>;large?:boolean}) {const Icon={layers:Layers,music:Music2,pen:PenTool,spark:Sparkles}[project.icon];return <span className={`project-icon tone-${project.color} ${large?'large':''}`}><Icon size={large?29:22} strokeWidth={1.7}/></span>;}
export const kindLabels:Record<ResourceKind,string>={diagram:'Diagrama',note:'Nota',document:'Documento',image:'Imagen',link:'Enlace',score:'Partitura'};
export function KindIcon({kind,size=17}:{kind:ResourceKind;size?:number}) {const Icon={diagram:Network,note:StickyNote,document:FileText,image:ImageIcon,link:Link2,score:Music2}[kind];return <Icon size={size} strokeWidth={1.7}/>;}
export function Choice({value,onChange,items,label,className=''}:{value:string;onChange:(v:string)=>void;items:{value:string;label:string}[];label:string;className?:string}) {return <Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label} className={className}><SelectValue /></SelectTrigger><SelectContent>{items.map(i=><SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectContent></Select>;}
export function EmptyView({title='No hay recursos todavía',description='Añade el primer archivo, nota o enlace del proyecto.'}:{title?:string;description?:string}) {return <Empty className="empty-view"><EmptyHeader><EmptyMedia variant="icon"><FolderOpen /></EmptyMedia><EmptyTitle>{title}</EmptyTitle><EmptyDescription>{description}</EmptyDescription></EmptyHeader></Empty>;}
export function Diagram({map=false}:{map?:boolean}) {return <svg className="diagram-svg" viewBox="0 0 380 220" role="img" aria-label={map?'Mapa de navegación entre grupos, proyectos y recursos':'React se conecta mediante API REST al backend y sus datos'}>
 <defs><pattern id={map?'dots-map':'dots-arch'} width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".65" fill="#c7cbd8"/></pattern></defs>
 <rect width="380" height="220" fill={map?'#f0f3fb':'#f5f4fb'}/><rect width="380" height="220" fill={`url(#${map?'dots-map':'dots-arch'})`}/>
 <g fill="none" stroke="#a5a3c5" strokeWidth="1.5"><path d="M112 101H157M241 101H274M199 124V159"/><path d="m151 97 6 4-6 4m117-8 6 4-6 4m-79 48 4 6 4-6"/></g>
 <g fill="white" stroke="#dad9e8"><rect x="24" y="77" width="88" height="48" rx="7"/><rect x="157" y="77" width="84" height="48" rx="7"/><rect x="274" y="77" width="83" height="48" rx="7"/><rect x="157" y="160" width="84" height="34" rx="7"/></g>
 <g textAnchor="middle" fontFamily="system-ui,sans-serif"><text x="190" y="38" fontSize="11" fontWeight="600" fill="#585473">{map?'ESTRUCTURA DE NAVEGACIÓN':'ARQUITECTURA TÉCNICA'}</text><text x="68" y="99" fontSize="11" fontWeight="600" fill="#5650c5">{map?'Grupos':'Frontend'}</text><text x="68" y="113" fontSize="8" fill="#848194">{map?'Integrantes':'React · TypeScript'}</text><text x="199" y="99" fontSize="11" fontWeight="600" fill="#5650c5">{map?'Proyectos':'API REST'}</text><text x="199" y="113" fontSize="8" fill="#848194">{map?'Trabajo compartido':'Comunicación'}</text><text x="315" y="99" fontSize="11" fontWeight="600" fill="#5650c5">{map?'Recursos':'Backend'}</text><text x="315" y="113" fontSize="8" fill="#848194">{map?'Fuente de verdad':'Monolito'}</text><text x="199" y="181" fontSize="10" fill="#686477">{map?'Permisos':'Datos del proyecto'}</text></g>
 </svg>;}
export function ResourcePreview({resource,full=false}:{resource:Resource;full?:boolean}) {
 if(resource.url?.startsWith('blob:')) {
  if(resource.mime?.startsWith('image/') && resource.mime!=='image/svg+xml') return <div className="uploaded-image"><img src={resource.url} alt={resource.title}/></div>;
  if(full&&resource.mime==='application/pdf')return <iframe title={resource.title} src={resource.url} className="pdf-frame"/>;
  return <div className="generic-preview"><KindIcon kind={resource.kind} size={44}/><span>{resource.originalName}</span></div>;
 }
 if(resource.kind==='diagram')return <Diagram/>;
 if(resource.kind==='image')return <Diagram map/>;
 if(resource.kind==='link'){let host='Referencia';try{host=new URL(resource.url||'').hostname.replace(/^www\./,'');}catch{}return <div className="link-preview"><span className="link-preview-icon"><Link2 size={24}/></span><strong>{host==='w3.org'?'W3C':host}</strong><span>{host==='w3.org'?'Web Accessibility Initiative':resource.title}</span><div>Abrir referencia <span>↗</span></div></div>;}
 if(resource.kind==='score')return <div className={`score-preview ${full?'full':''}`}><small>GUÍA DE ENSAYO · 92 BPM</small><h3>Viento del norte</h3><span>Guitarra · La menor</span><div className="chord-row"><b>Am</b><b>F</b><b>C</b><b>G</b></div><div className="chord-row"><b>F</b><b>G</b><b>Am</b><b>Am</b></div>{full&&<p className="pre-content">{resource.content}</p>}</div>;
 const lines=resource.content.split('\n').filter(Boolean);
 return <div className={`paper-preview ${resource.kind==='note'?'note-paper':''} ${full?'full':''}`}><div className="paper-eyebrow">{resource.kind==='note'?'NOTAS DEL EQUIPO':'DOCUMENTACIÓN'}</div><h3>{lines[0]||resource.title}</h3>{full?<p className="pre-content">{lines.slice(1).join('\n\n')}</p>:<><p>{lines[1]}</p><div className="paper-line"/><div className="paper-line short"/><p className="paper-subtitle">{lines[2]}</p><div className="paper-line"/><div className="paper-line medium"/></>}</div>;
}
