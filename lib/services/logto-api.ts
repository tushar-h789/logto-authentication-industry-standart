import { OidcConfig, LogtoUser } from "@/lib/types/auth";

export async function fetchOidcConfig(): Promise<OidcConfig> {
  const endpointEnv = process.env.NEXT_PUBLIC_LOGTO_ENDPOINT || "";
  const endpoint = endpointEnv.replace(/\/+$/, "");
  const response = await fetch(
    `${endpoint}/oidc/.well-known/openid-configuration`,
    { cache: "force-cache" }
  );
  // console.log(".well", response);

  if (!response.ok) {
    throw new Error("Failed to fetch OIDC configuration");
  }
  const data = await response.json();
  // Map snake_case from discovery to our camelCase OidcConfig
  return {
    authorizationEndpoint: data.authorization_endpoint,
    tokenEndpoint: data.token_endpoint,
    userinfoEndpoint: data.userinfo_endpoint,
    issuer: data.issuer,
    jwksUri: data.jwks_uri,
  };
}

export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<{
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresIn?: number;
}> {
  const config = await fetchOidcConfig();
  const appId = process.env.NEXT_PUBLIC_LOGTO_APP_ID;
  const appSecret = process.env.LOGTO_APP_SECRET;
  // redirectUri provided by caller to ensure exact match with authorize request
  // console.log("info", config, appId, appSecret);

  const params = new URLSearchParams();
  params.set("grant_type", "authorization_code");
  if (appId) params.set("client_id", appId);
  if (appSecret) params.set("client_secret", appSecret);
  params.set("code", code);
  params.set("code_verifier", codeVerifier);
  params.set("redirect_uri", redirectUri);

  const response = await fetch(config.tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  // console.log("response", response);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data = await response.json();
  // console.log("data token", data);

  // Map snake_case fields from Logto to our camelCase contract
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    idToken: data.id_token,
    expiresIn: data.expires_in,
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
  refreshToken?: string;
}> {
  const config = await fetchOidcConfig();
  const appId = process.env.NEXT_PUBLIC_LOGTO_APP_ID;
  const appSecret = process.env.LOGTO_APP_SECRET;

  const refreshParams = new URLSearchParams();
  refreshParams.set("grant_type", "refresh_token");
  if (appId) refreshParams.set("client_id", appId);
  if (appSecret) refreshParams.set("client_secret", appSecret);
  refreshParams.set("refresh_token", refreshToken);

  const response = await fetch(config.tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: refreshParams.toString(),
  });
  // console.log("refresh response token", response);

  if (!response.ok) {
    throw new Error("Token refresh failed");
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
    refreshToken: data.refresh_token,
  };
}

export async function fetchUserInfo(accessToken: string): Promise<LogtoUser> {
  const config = await fetchOidcConfig();

  const response = await fetch(config.userinfoEndpoint, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  // console.log("fetch user info in token", response);

  if (!response.ok) {
    throw new Error("Failed to fetch user info");
  }

  return response.json();
}
