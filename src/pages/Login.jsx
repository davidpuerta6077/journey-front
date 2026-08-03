import { useAuth } from "react-oidc-context";
import '../styles/global/Login.css'

function Login() {
  const auth = useAuth();

  const signOutRedirect = () => {
    const clientId = "5hpvb84h2hm3rfsf6mbfs936hc";
    const logoutUri = "https://obscure-potato-wxvr56gq9pg257wq-5173.app.github.dev/login";
    const cognitoDomain = "https://us-east-1ynphsrvag.auth.us-east-1.amazoncognito.com";

    auth.removeUser();
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  };

  if (auth.isLoading) {
    return <div className="login-container"><p>Cargando...</p></div>;
  }

  if (auth.error) {
    return <div className="login-container"><p>Error: {auth.error.message}</p></div>;
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
        <h1>Bravo Suite</h1>
        <p>Inicia sesión para continuar</p>
        <button className="btn btn-signin" onClick={() => auth.signinRedirect()}>
          Iniciar sesión
        </button>
      </div>
    </div>
  );
}

export default Login;