import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global/index.css'
import App from './App.jsx'

import { AuthProvider } from "react-oidc-context";

const cognitoAuthConfig = {
  authority: "https://us-east-1xcezs3mwh.auth.us-east-1.amazoncognito.com",
  client_id: "5ij2u3s8ipssnrtmu6nlvjj3da",
  redirect_uri: "https://sturdy-space-trout-j9rj76qp94q3jpq4-5173.app.github.dev/HomeJourney",
  response_type: "code",
  scope: "email openid phone",
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <App />
    </AuthProvider>
  </StrictMode>,
)