import { User } from "oidc-client-ts";

const oidcConfig = {
  authority: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_ynphSRVAg",
  client_id: "5hpvb84h2hm3rfsf6mbfs936hc",
};

function getUser() {
  const oidcStorage = sessionStorage.getItem(
    `oidc.user:${oidcConfig.authority}:${oidcConfig.client_id}`
  );
  if (!oidcStorage) return null;
  return User.fromStorageString(oidcStorage);
}

function getToken() {
  const user = getUser();
  return user ? user.id_token : null;
}

function getEmail() {
  const user = getUser();
  return user ? user.profile.email : null;
}

function isAuthenticated() {
  const user = getUser();
  return !!user && !user.expired;
}

export default { getToken, getEmail, isAuthenticated };