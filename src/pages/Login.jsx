import { useAuth } from "react-oidc-context";
import { useEffect, useRef } from "react";
import '../styles/global/Login.css'
import config from "../config.js";

function Login() {
  const auth = useAuth();
  // Errores de oidc-client-ts (state corrupto por volver atrás, token de otra
  // sesión, etc.) dejaban al usuario en un mensaje sin salida, obligando a
  // borrar localStorage/cookies a mano. Se limpia la sesión sola y se
  // reintenta el login una vez; si vuelve a fallar, ahí sí se pide reintentar.
  const reintentoAutomatico = useRef(false);
  useEffect(() => {
    if (!auth.error || reintentoAutomatico.current) return;
    reintentoAutomatico.current = true;
    auth.removeUser()
      .catch(() => {})
      .finally(() => {
        auth.clearStaleState().catch(() => {});
        auth.signinRedirect();
      });
  }, [auth.error]);

  const signOutRedirect = () => {
    const clientId = "5hpvb84h2hm3rfsf6mbfs936hc";
    const logoutUri = `${config.aws.redirect_uri}/login`; 
    const cognitoDomain = "https://us-east-1ynphsrvag.auth.us-east-1.amazoncognito.com";

    auth.removeUser();
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  };

  if (auth.isLoading) {
    return <div className="login-container"><span className="loader"></span></div>;
  }

  if (auth.error) {
    return (
      <div className="login-container">
        <div className="login-card">
          <span className="loader"></span>
          <p>Renovando la sesión...</p>
          <button className="btn btn-signin" onClick={() => { reintentoAutomatico.current = true; auth.removeUser().finally(() => auth.signinRedirect()); }}>
            Reintentar manualmente
          </button>
        </div>
      </div>
    );
  }

  if (auth.isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h2>Ya has iniciado sesión</h2>
          <button className="btn btn-signout" onClick={signOutRedirect}>
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Bravo Hub</h1>
        <p>Inicia sesión para continuar</p>
        <button className="btn btn-signin" onClick={() => auth.signinRedirect()}>
          Iniciar sesión
        </button>
      </div>
    </div>
  );
}

export default Login;