import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "react-oidc-context";
import { GetServiceAuth } from "./GetServiceAuth";
import { fetchMyProfile } from "./perfil/fetchMyProfile";

const PermissionsContext = createContext();

export function PermissionsProvider({ children }) {
  const auth = useAuth();
  const [permissions, setPermissions] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  const loadPermissionsAndProfile = useCallback(async () => {
    if (auth.isAuthenticated) {
      const result = await GetServiceAuth(`auth/permissions?user_email=${encodeURIComponent(auth.user?.profile?.email)}`);
      setPermissions(result?.body?.user_permissions || null);
      try {
        setProfile(await fetchMyProfile());
      } catch {
        setProfile(null);
      }
    }
    setLoadingPermissions(false);
  }, [auth.isAuthenticated, auth.user?.profile?.email]);

  useEffect(() => { loadPermissionsAndProfile() }, [loadPermissionsAndProfile]);

  return (
    <PermissionsContext.Provider value={{ permissions, profile, loadingPermissions, refetchProfile: loadPermissionsAndProfile }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export const usePermissions = () => useContext(PermissionsContext);
