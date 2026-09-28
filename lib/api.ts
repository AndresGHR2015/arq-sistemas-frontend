// Tokens only in memory: reload requires login until persistent sessions are agreed.
let access: string | null = null;
let refresh: string | null = null;
let generation = 0;
let renewal: Promise<void> | null = null;
export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function logout() { generation++; access = null; refresh = null; renewal = null; }
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
}
async function renew() {
  if (!refresh) throw new ApiError(401, 'Tu sesión ha terminado.');
  const current = generation;
  const response = await fetch('/api/token/refresh/', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({refresh}), cache:'no-store'});
  if (current !== generation) throw new ApiError(401, 'Tu sesión ha terminado.');
  if (!response.ok) { logout(); throw new ApiError(401, 'Tu sesión ha terminado. Vuelve a entrar.'); }
  const data = await response.json();
  if (typeof data.access !== 'string') { logout(); throw new ApiError(401, 'Respuesta de renovación inválida.'); }
  access = data.access;
  if (typeof data.refresh === 'string') refresh = data.refresh;
}
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!path.startsWith('/api/') || path.includes('://')) throw new Error('Ruta API inválida');
  if (!access) throw new ApiError(401, 'Inicia sesión para continuar.');
  const current = generation;
  const send = () => fetch(path, {...init, cache:'no-store', headers:{...Object.fromEntries(new Headers(init.headers)), Authorization:`Bearer ${access}`}});
  let response: Response;
  try {
    response = await send();
    if (current !== generation) throw new ApiError(401, 'Tu sesión ha terminado.');
    if (response.status === 401) {
      if (!renewal) renewal = renew().finally(() => { renewal = null; });
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
    throw new ApiError(response.status, response.status === 403 ? 'No tienes permiso para realizar esta acción.' : `No se pudo completar la petición (${response.status}).`);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}
export interface ArchivoDTO {
  id: number; nombre_original: string; archivo: string; categoria: string | null;
  usuario: number; proyecto: number; fecha_subido: string; global: boolean;
}
export async function listFiles(): Promise<ArchivoDTO[]> {
  const data = await api<ArchivoDTO[] | {results: ArchivoDTO[]}>('/api/archivos/');
  return Array.isArray(data) ? data : data.results;
}
