import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "react-oidc-context";
import { GetServiceAuth } from "./GetServiceAuth";
import { fetchMyProfile } from "./perfil/fetchMyProfile";
import { fetchSettings } from "./settings/fetchSettings";

const PermissionsContext = createContext();

const INTENTOS_PERMISOS = 3;
const CHECK_SESION_MS = 60 * 1000;

// oidc-client-ts filtra auth_time de user.profile (es claim de protocolo, no
// de perfil) aunque esté en el id_token, así que hay que leerlo del JWT.
function getAuthTime(idToken) {
  try {
    return JSON.parse(atob(idToken.split('.')[1])).auth_time;
  } catch {
    return null;
  }
}

export function PermissionsProvider({ children }) {
  const auth = useAuth();
  const { signinSilent } = auth;
  // react-oidc-context recrea `auth` (y removeUser) en cada render interno
  // propio (silent renew, chequeos de expiración, etc.), no solo cuando
  // cambia isAuthenticated: si el intervalo de abajo dependiera de esos
  // valores directamente, se reiniciaría antes de completar los 60s y nunca
  // llegaría a dispararse. Por eso se lee todo vía ref dentro del interval.
  const authRef = useRef(auth);
  authRef.current = auth;

  // Tiempo máximo de sesión configurable en Configuración > Sistema. Se mide
  // desde auth_time (login original en Cognito), no desde iat: así una sesión
  // no se "renueva" sola para siempre vía automaticSilentRenew. Al vencer se
  // limpia la sesión sola (removeUser), sin que el usuario tenga que borrar
  // cookies/localStorage a mano.
  useEffect(() => {
    let sesionMaxHoras = null;
    fetchSettings('sistema')
      .then(settings => {
        const v = Number((settings || []).find(s => s.clave === 'sesion_max_horas')?.valor);
        if (v > 0) sesionMaxHoras = v;
      })
      .catch(() => {});

    const interval = setInterval(() => {
      const a = authRef.current;
      const authTime = a.user?.id_token ? getAuthTime(a.user.id_token) : null;
      if (!sesionMaxHoras || !a.isAuthenticated || !authTime) return;
      const horasTranscurridas = (Date.now() / 1000 - authTime) / 3600;
      if (horasTranscurridas >= sesionMaxHoras) a.removeUser();
    }, CHECK_SESION_MS);

    return () => clearInterval(interval);
  }, []);
  const [permissions, setPermissions] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  // true cuando /auth/permissions no respondió (API caída, BD/túnel lento,
  // reinicio de nodemon): no es lo mismo que "no tiene permisos", así que
  // PrivateRoute no debe mandar a /no-autorizado en ese caso.
  const [permissionsError, setPermissionsError] = useState(false);
  const renovacionIntentada = useRef(false);

  const loadPermissionsAndProfile = useCallback(async () => {
    if (auth.isLoading) return;
    if (!auth.isAuthenticated) {
      // Al recargar con la sesión guardada pero el token ya vencido (pestaña
      // cerrada o dormida más de lo que dura el token), oidc la da por no
      // autenticada. Antes de mandar a /login se intenta renovarla en silencio
      // con el refresh token; si funciona, isAuthenticated pasa a true y este
      // efecto vuelve a correr con la sesión renovada.
      if (auth.user?.expired && !renovacionIntentada.current) {
        renovacionIntentada.current = true;
        try {
          await signinSilent();
          return;
        } catch {
          // sin refresh token válido: se sigue al login normal
        }
      }
      setPermissions(null);
      setLoadingPermissions(false);
      return;
    }

    let result = null;
    for (let intento = 0; intento < INTENTOS_PERMISOS && !result; intento++) {
      if (intento > 0) await new Promise((r) => setTimeout(r, 1000 * intento));
      result = await GetServiceAuth('auth/permissions');
    }
    setPermissions(result?.body?.user_permissions || null);
    setPermissionsError(!result);
    try {
      setProfile(await fetchMyProfile());
    } catch {
      setProfile(null);
    }
    setLoadingPermissions(false);
  }, [auth.isLoading, auth.isAuthenticated, auth.user?.expired, signinSilent]);

  useEffect(() => { loadPermissionsAndProfile() }, [loadPermissionsAndProfile]);

  return (
    <PermissionsContext.Provider value={{ permissions, profile, loadingPermissions, permissionsError, refetchProfile: loadPermissionsAndProfile }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export const usePermissions = () => useContext(PermissionsContext);
