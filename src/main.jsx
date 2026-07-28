import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global/index.css'
import App from './App.jsx'

import { AuthProvider } from "react-oidc-context";

const cognitoAuthConfig = {
  authority: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_ynphSRVAg",
  client_id: "5hpvb84h2hm3rfsf6mbfs936hc",
  redirect_uri: "https://organic-engine-g6x4r97v7492w6rx-5173.app.github.dev",
  response_type: "code",
  scope: "phone openid email",
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <App />
    </AuthProvider>
  </StrictMode>,
)