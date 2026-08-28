import { useAuth } from "react-oidc-context";
import { Navigate } from "react-router-dom";
import { usePermissions } from "../services/PermissionsContext";

export default function PrivateRoute({ children, submoduleCode }) {
  const auth = useAuth();
  const { permissions, loadingPermissions } = usePermissions();

  if (auth.isLoading || loadingPermissions) return <p>Cargando...</p>;
  if (!auth.isAuthenticated) return <Navigate to="/login" replace />;

  if (submoduleCode) {
    const hasAccess = permissions?.modules?.some((m) =>
      m.submodules.some((s) => s.submodule_code === submoduleCode)
    );
    if (!hasAccess) return <Navigate to="/no-autorizado" replace />;
  }

  return children;
}