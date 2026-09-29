import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "react-oidc-context";
import { GetServiceAuth } from "./GetServiceAuth";
import { fetchMyProfile } from "./perfil/fetchMyProfile";

const PermissionsContext = createContext();

const INTENTOS_PERMISOS = 3;

export function PermissionsProvider({ children }) {
  const auth = useAuth();
  const { signinSilent } = auth;
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
