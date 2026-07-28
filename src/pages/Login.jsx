import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { LogIn, Eye, EyeOff } from 'lucide-react'
import { loginService } from '../services/auth/login'
import '../styles/global/Login.css'

import { useAuth } from "react-oidc-context";

export default function Login() {
  const auth = useAuth();
  const navigate = useNavigate()

  const signOutRedirect = () => {
    const clientId = "5ij2u3s8ipssnrtmu6nlvjj3da";
    const logoutUri = "<logout uri>";
    const cognitoDomain = "https://us-east-1xcezs3mwh.auth.us-east-1.amazoncognito.com";
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  };


  // if (auth.isLoading) {
  //   return <div>Loading...</div>;
  // }

  // if (auth.error) {
  //   return <div>Encountering error... {auth.error.message}</div>;
  // }

  // if (auth.isAuthenticated) {
  //     return <Navigate to="/HomeJourney" replace />;
  // }

  if (true) {
    return <Navigate to="/" replace />;
  }

  console.log(auth)

return (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      background: "#f4f6f9",
      fontFamily: "Arial, sans-serif",
    }}
  >
    <div
      style={{
        background: "#fff",
        padding: "40px",
        borderRadius: "12px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        textAlign: "center",
        minWidth: "350px",
      }}
    >
      <h1 style={{ marginBottom: "10px", color: "#333" }}>
        Bienvenido
      </h1>

      <p style={{ color: "#666", marginBottom: "30px" }}>
        Inicia sesión con tu cuenta institucional.
      </p>

      <button
        onClick={() => auth.signinRedirect()}
        style={{
          width: "100%",
          padding: "12px",
          background: "#4F46E5",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          fontSize: "16px",
          cursor: "pointer",
          marginBottom: "15px",
          transition: "0.2s",
        }}
      >
        🔐 Iniciar sesión
      </button>

      <button
        onClick={() => signOutRedirect()}
        style={{
          width: "100%",
          padding: "12px",
          background: "#000000",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          fontSize: "16px",
          cursor: "pointer",
          transition: "0.2s",
        }}
      >
        🚪 Cerrar sesión
      </button>
    </div>
  </div>
);
}