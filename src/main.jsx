import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/global/index.css";
import "./styles/global/Tables.css";
import App from "./App.jsx";
import config from "./config.js";

import { AuthProvider } from "react-oidc-context";
import { WebStorageStateStore } from "oidc-client-ts";
import { PermissionsProvider } from "./services/PermissionsContext";

const cognitoAuthConfig = {
  authority: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_ynphSRVAg",
  client_id: "5hpvb84h2hm3rfsf6mbfs936hc",
  redirect_uri: config.aws.redirect_uri,
  response_type: "code",
  scope: "phone openid email",
  automaticSilentRenew: true,
  // localStorage (no sessionStorage) para que la sesión se comparta entre pestañas
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname);
  },
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