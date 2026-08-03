import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { GetServiceAuth } from "./GetServiceAuth";

const PermissionsContext = createContext();

export function PermissionsProvider({ children }) {
  const auth = useAuth();
  const [permissions, setPermissions] = useState(null);
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (auth.isAuthenticated) {
    const result = await GetServiceAuth(`auth/permissions?user_email=${encodeURIComponent(auth.user?.profile?.email)}`);
        setPermissions(result?.body?.user_permissions || null);
      }
      setLoadingPermissions(false);
    };
    fetchPermissions();
  }, [auth.isAuthenticated]);

  console.log(permissions)

  return (
    <PermissionsContext.Provider value={{ permissions, loadingPermissions }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export const usePermissions = () => useContext(PermissionsContext);