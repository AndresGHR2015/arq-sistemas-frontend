// Tokens only in memory: reload requires login until persistent sessions are agreed.
let access: string | null = null;
let refresh: string | null = null;
let generation = 0;
let renewal: Promise<void> | null = null;
const sessionListeners = new Set<() => void>();
let sessionVersion = 0;
export function subscribeSession(listener: () => void) {
  sessionListeners.add(listener);
  return () => { sessionListeners.delete(listener); };
}
export function getSessionVersion() { return sessionVersion; }
function notifySession() { sessionVersion++; sessionListeners.forEach(listener => listener()); }
export class ApiError extends Error {
  constructor(public status: number, message: string, public fields: Record<string, string[]> = {}) { super(message); }
}
export function logout() { generation++; access = null; refresh = null; renewal = null; notifySession(); }
export function hasSession() { return access !== null; }
export async function login(username: string, password: string) {
  logout();
  const current = generation;
  let response: Response;
  try {
    response = await fetch('/api/token/', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({username, password}), cache:'no-store' });
  } catch { throw new ApiError(0, 'No se pudo conectar con el servidor.'); }
  if (!response.ok) throw new ApiError(response.status, response.status === 401 ? 'Usuario o contraseña incorrectos.' : 'No se pudo iniciar sesión. Comprueba que el backend esté disponible.');
  const data = await response.json();
  if (typeof data.access !== 'string' || typeof data.refresh !== 'string') throw new ApiError(502, 'Respuesta de autenticación inesperada.');
  if (current !== generation) throw new ApiError(401, 'Inicio de sesión cancelado.');
  access = data.access; refresh = data.refresh;
  notifySession();
}
async function renew() {
  if (!refresh) throw new ApiError(401, 'Tu sesión ha terminado.');
  const current = generation;
  const response = await fetch('/api/token/refresh/', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({refresh}), cache:'no-store'});
  if (current !== generation) throw new ApiError(401, 'Tu sesión ha terminado.');
  if (!response.ok) { logout(); throw new ApiError(401, 'Tu sesión ha terminado. Vuelve a entrar.'); }
  const data = await response.json();
  if (current !== generation) throw new ApiError(401, 'Tu sesión ha terminado.');
  if (typeof data.access !== 'string') { logout(); throw new ApiError(401, 'Respuesta de renovación inválida.'); }
  access = data.access;
  if (typeof data.refresh === 'string') refresh = data.refresh;
}
async function request(path: string, init: RequestInit = {}): Promise<Response> {
  if (!path.startsWith('/api/') || path.includes('://')) throw new Error('Ruta API inválida');
  if (!access) throw new ApiError(401, 'Inicia sesión para continuar.');
  const current = generation;
  const send = () => fetch(path, {...init, cache:'no-store', headers:{...Object.fromEntries(new Headers(init.headers)), Authorization:`Bearer ${access}`}});
  let response: Response;
  try {
    response = await send();
    if (current !== generation) throw new ApiError(401, 'Tu sesión ha terminado.');
    if (response.status === 401) {
      if (!renewal) {
        const pending = renew().finally(() => { if (renewal === pending) renewal = null; });
        renewal = pending;
      }
      await renewal;
      if (current !== generation) throw new ApiError(401, 'Tu sesión ha terminado.');
      response = await send();
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, 'No se pudo conectar con el servidor.');
  }
  if (current !== generation) throw new ApiError(401, 'Tu sesión ha terminado.');
  if (!response.ok) {
    if (response.status === 401) logout();
    const body = await response.json().catch(() => ({}));
    const fields: Record<string, string[]> = {};
    if (body && typeof body === 'object') {
      for (const [key, value] of Object.entries(body)) {
        fields[key] = (Array.isArray(value) ? value : [value]).filter((item): item is string => typeof item === 'string');
      }
    }
    throw new ApiError(response.status, response.status === 403 ? 'No tienes permiso para realizar esta acción.' : response.status === 404 ? 'Este elemento ya no está disponible o no tienes acceso.' : response.status === 400 ? 'Revisa los datos del formulario.' : 'No se pudo completar la acción. Inténtalo de nuevo.', fields);
  }
  return response;
}
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const current = generation;
  const response = await request(path, init);
  const data = response.status === 204 ? undefined : await response.json();
  if (current !== generation) throw new ApiError(401, 'Tu sesión ha terminado.');
  return data as T;
}
export interface ArchivoDTO {
  id: number; nombre_original: string; archivo: string; categoria: string | null;
  usuario: number; proyecto: number; fecha_subido: string; global: boolean;
  permissions: {edit: boolean; delete: boolean; download: boolean};
}

export interface IdentityDTO {
  id: number; username: string;
  permissions: {create_project: boolean; create_group: boolean};
}
export interface ProjectDTO {
  id: number; nombre: string; descripcion: string | null; equipos: number[];
  permissions: {edit: boolean; delete: boolean; manage_teams: boolean; upload_files: boolean};
}
export interface GroupDTO {
  id: number; nombre: string; equipo_recurrente: boolean; usuarios: number[];
  permissions: {edit: boolean; delete: boolean; manage_members: boolean};
}
export interface MemberDTO {usuario: number; username: string; rol: string | null}
const json = (method: string, body: unknown): RequestInit => ({method, headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)});
export async function list<T>(path: string): Promise<T[]> {
  const data = await api<T[] | {results: T[]}>(path);
  return Array.isArray(data) ? data : data.results;
}
export const getIdentity = () => api<IdentityDTO>('/api/me/');
export const listProjects = () => list<ProjectDTO>('/api/proyectos/');
export const listGroups = () => list<GroupDTO>('/api/equipos/');
export const getProject = (id: number) => api<ProjectDTO>(`/api/proyectos/${id}/`);
export const getGroup = (id: number) => api<GroupDTO>(`/api/equipos/${id}/`);
export const createProject = (body: {nombre: string; descripcion: string; equipo?: number}) => api<ProjectDTO>('/api/proyectos/', json('POST', body));
export const createGroup = (body: {nombre: string; equipo_recurrente: boolean}) => api<GroupDTO>('/api/equipos/', json('POST', body));
export const updateProject = (id: number, body: {nombre: string; descripcion: string}) => api<ProjectDTO>(`/api/proyectos/${id}/`, json('PATCH', body));
export const updateGroup = (id: number, body: {nombre: string; equipo_recurrente: boolean}) => api<GroupDTO>(`/api/equipos/${id}/`, json('PATCH', body));
export const deleteProject = (id: number) => api<void>(`/api/proyectos/${id}/`, {method:'DELETE'});
export const deleteGroup = (id: number) => api<void>(`/api/equipos/${id}/`, {method:'DELETE'});
export const listProjectGroups = (id: number) => list<GroupDTO>(`/api/proyectos/${id}/equipos/`);
export const listGroupProjects = (id: number) => list<ProjectDTO>(`/api/equipos/${id}/proyectos/`);
export const listMembers = (id: number) => list<MemberDTO>(`/api/equipos/${id}/miembros/`);
export const addMember = (id: number, usuario: number, rol: string) => api<{usuario: number; equipo: number; rol: string}>(`/api/equipos/${id}/miembros/`, json('POST', {usuario, rol}));
export const removeMember = (id: number, userId: number) => api<void>(`/api/equipos/${id}/miembros/${userId}/`, {method:'DELETE'});
export const associateGroup = (id: number, equipo: number) => api<{equipo: number; proyecto: number}>(`/api/proyectos/${id}/equipos/`, json('POST', {equipo}));
export const removeGroupAssociation = (id: number, groupId: number) => api<void>(`/api/proyectos/${id}/equipos/${groupId}/`, {method:'DELETE'});
export function uploadFile(proyecto: number, file: File, categoria: string, projectWide: boolean) {
  const body = new FormData();
  body.append('archivo', file);body.append('nombre_original', file.name);body.append('proyecto', String(proyecto));
  body.append('categoria', categoria);body.append('global', String(projectWide));
  return api<ArchivoDTO>('/api/archivos/', {method:'POST',body});
}
export const updateFile = (id: number, body: {nombre_original: string; categoria: string; global: boolean}) => api<ArchivoDTO>(`/api/archivos/${id}/`, json('PATCH', body));
export function replaceFile(id: number, file: File, metadata: {nombre_original: string; categoria: string; global: boolean}) {
  const body = new FormData();body.append('archivo',file);
  for (const [key,value] of Object.entries(metadata)) body.append(key,String(value));
  return api<ArchivoDTO>(`/api/archivos/${id}/`, {method:'PATCH',body});
}
export const deleteFile = (id: number) => api<void>(`/api/archivos/${id}/`, {method:'DELETE'});
export async function downloadFile(id: number): Promise<Blob> {
  const current = generation;
  const response = await request(`/api/archivos/${id}/download/`);
  const blob = await response.blob();
  if (current !== generation) throw new ApiError(401, 'Tu sesión ha terminado.');
  return blob;
}
export async function listFiles(): Promise<ArchivoDTO[]> {
  const data = await api<ArchivoDTO[] | {results: ArchivoDTO[]}>('/api/archivos/');
  return Array.isArray(data) ? data : data.results;
}
