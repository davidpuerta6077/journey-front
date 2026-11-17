// Cliente HTTP central: interceptores sobre el axios por defecto, que es el que usan todas las vistas.
// En cada petición a la API:
//   Authorization = token de aplicación (lo valida el authorizer de API Gateway)
//   X-User-Token  = token de la persona que inició sesión (lo valida checkAuth en la API)
// Ante un 401 renueva el token de aplicación y reintenta una sola vez; si vuelve a fallar, el error sigue a la vista.
import axios from "axios";
import config from "../../config";
import { getValidToken, TOKEN_PATH } from "../auth/tokenManager";

const base = config.api_domain.url_base;
const esDeLaApi = (url = "") => !!base && url.startsWith(base) && !url.startsWith(`${base}${TOKEN_PATH}`);

const ponerToken = async (cfg, forzar) => {
  let token;
  try {
    token = await getValidToken({ forzar });
  } catch (err) {
    // Sin token de aplicación la petición sale como antes (sirve en local o directo a la API).
    console.warn("No se pudo obtener el token de aplicación:", err.message);
    return cfg;
  }
  const actual = cfg.headers.get?.("Authorization") ?? cfg.headers.Authorization;
  // El token de la persona pasa a X-User-Token (solo la primera vez: en el reintento ya está ahí).
  if (actual && !cfg._userTokenMovido) {
    cfg.headers["X-User-Token"] = String(actual).replace(/^Bearer\s+/i, "");
    cfg._userTokenMovido = true;
  }
  cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
};

axios.interceptors.request.use((cfg) => (esDeLaApi(cfg.url) ? ponerToken(cfg, false) : cfg));

axios.interceptors.response.use(undefined, async (error) => {
  const cfg = error.config;
  if (error.response?.status !== 401 || !cfg || cfg._reintentado || !esDeLaApi(cfg.url)) throw error;
  cfg._reintentado = true;
  await ponerToken(cfg, true);
  return axios(cfg);
});
