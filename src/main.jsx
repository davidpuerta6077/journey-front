import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/global/index.css";
import App from "./App.jsx";

import { AuthProvider } from "react-oidc-context";
import { PermissionsProvider } from "./services/PermissionsContext";

const cognitoAuthConfig = {
  authority: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_ynphSRVAg",
  client_id: "5hpvb84h2hm3rfsf6mbfs936hc",
  redirect_uri: "https://obscure-potato-wxvr56gq9pg257wq-5173.app.github.dev",
  response_type: "code",
  scope: "phone openid email",
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <PermissionsProvider>
        <App />
      </PermissionsProvider>
    </AuthProvider>
  </StrictMode>
);