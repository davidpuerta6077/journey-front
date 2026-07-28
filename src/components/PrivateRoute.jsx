import { useAuth } from "react-oidc-context";
import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children }) {
      const auth = useAuth();

    if (auth.isLoading) return <p>Cargando...</p>;
    if (!auth.isAuthenticated) return <Navigate to="/login" replace />;

    return children;
}