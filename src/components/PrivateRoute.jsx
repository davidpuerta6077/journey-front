import { useAuth } from "react-oidc-context";
import { Navigate } from "react-router-dom";
import { usePermissions } from "../services/PermissionsContext";

export default function PrivateRoute({ children, submoduleCode }) {
  const auth = useAuth();
  const { permissions, loadingPermissions, permissionsError } = usePermissions();

  if (auth.isLoading || loadingPermissions) {
    return (
      <div className="loading-box" style={{ minHeight: '100vh' }}>
        <span className="loader"></span>
      </div>
    );
  }
  if (!auth.isAuthenticated) return <Navigate to="/login" replace />;

  // La API no respondió al cargar permisos: no es falta de permisos, así que
  // no se manda a /no-autorizado (parecería que la sesión se perdió).
  if (permissionsError) {
    return (
      <div className="loading-box" style={{ minHeight: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <p>No se pudieron cargar tus permisos. Verifica tu conexión e intenta de nuevo.</p>
        <button className="btn-primary" onClick={() => window.location.reload()}>Reintentar</button>
      </div>
    );
  }

  // submoduleCode: un código o una lista (basta con tener uno, p. ej. Asignia).
  if (submoduleCode) {
    const codes = [].concat(submoduleCode);
    const hasAccess = permissions?.modules?.some((m) =>
      m.submodules.some((s) => codes.includes(s.submodule_code))
    );
    if (!hasAccess) return <Navigate to="/no-autorizado" replace />;
  }

  return children;
}