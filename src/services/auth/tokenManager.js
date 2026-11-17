// Token de aplicación para API Gateway (client_credentials de Cognito).
// El front NUNCA tiene el client_secret: le pide el token a la API en GET /auth/token.
// La firma del token la valida el authorizer de API Gateway; aquí solo se revisa que exista y esté vigente.
import axios from "axios";
import config from "../../config";

const MARGEN_S = 60;            // se renueva 60 s antes de que venza
const STORAGE_KEY = "bh_app_token";
export const TOKEN_PATH = "/auth/token";

// En memoria, para no exponerlo más de lo necesario. sessionStorage es solo un respaldo para no pedir
// otro token al recargar la página; vive en esa pestaña y se borra al cerrarla o al cerrar sesión.
let current = null;             // { token, exp } con exp en segundos (epoch)
let pending = null;             // renovación en curso, compartida por todas las peticiones

const ahora = () => Math.floor(Date.now() / 1000);

// Lee el claim "exp" del JWT (sin verificar la firma: eso lo hace API Gateway).
const expDelJwt = (token) => {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload)).exp || null;
  } catch {
    return null;
  }
};

const vigente = (t) => !!t?.token && ahora() < t.exp - MARGEN_S;

const leerRespaldo = () => {
  try {
    const t = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
    return vigente(t) ? t : null;
  } catch {
    return null;
  }
};

const pedirToken = async () => {
  const { data } = await axios.get(`${config.api_domain.url_base}${TOKEN_PATH}`, { timeout: 15000 });
  const body = data?.body || data;
  // exp del JWT y, si no se puede leer, expires_in; se usa el menor de los dos.
  const porExpiresIn = ahora() + Number(body.expires_in || 0);
  const exp = Math.min(expDelJwt(body.access_token) || porExpiresIn, porExpiresIn || Infinity);
  current = { token: body.access_token, exp };
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(current)); } catch { /* sin storage: solo memoria */ }
  return current.token;
};

export const getValidToken = async ({ forzar = false } = {}) => {
  if (!forzar) {
    if (vigente(current)) return current.token;
    const respaldo = leerRespaldo();
    if (respaldo) { current = respaldo; return current.token; }
  }
  pending = pending || pedirToken().finally(() => { pending = null; });
  return pending;
};

export const clearAppToken = () => {
  current = null;
  try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* nada */ }
};
