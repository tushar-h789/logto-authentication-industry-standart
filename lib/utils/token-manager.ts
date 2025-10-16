import { cookies } from "next/headers";

const TOKEN_COOKIE_NAME = "logto_token_set";
const REFRESH_TOKEN_COOKIE_NAME = "logto_refresh_token";
const EXPIRES_AT_COOKIE_NAME = "logto_expires_at";
const PKCE_VERIFIER_COOKIE_NAME = "pkce_verifier";

console.log("token set in coocke", TOKEN_COOKIE_NAME);

interface CookieOptions {
  secure: boolean;
  httpOnly: boolean;
  sameSite: "lax" | "strict" | "none";
  path: string;
  maxAge?: number; // seconds
}

const getSecureCookieOptions = (maxAgeSeconds?: number): CookieOptions => ({
  secure: process.env.NODE_ENV === "production",
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  ...(maxAgeSeconds ? { maxAge: maxAgeSeconds } : {}),
});

export async function storeTokens(
  accessToken: string,
  refreshToken?: string,
  expiresIn?: number
): Promise<void> {
  const cookieStore = await cookies();
  console.log("cookie store", cookieStore);

  const expiresAt = expiresIn
    ? Math.floor(Date.now() / 1000) + expiresIn
    : undefined;

  cookieStore.set(
    TOKEN_COOKIE_NAME,
    accessToken,
    getSecureCookieOptions(expiresIn ? expiresIn : undefined)
  );

  if (refreshToken) {
    cookieStore.set(
      REFRESH_TOKEN_COOKIE_NAME,
      refreshToken,
      getSecureCookieOptions(30 * 24 * 60 * 60) // 30 days in seconds
    );
  }

  if (expiresAt) {
    cookieStore.set(
      EXPIRES_AT_COOKIE_NAME,
      expiresAt.toString(),
      getSecureCookieOptions(expiresIn ? expiresIn : undefined)
    );
  }
}

export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_COOKIE_NAME)?.value ?? null;
}

export async function getRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_TOKEN_COOKIE_NAME)?.value ?? null;
}

export async function getTokenExpiresAt(): Promise<number | null> {
  const cookieStore = await cookies();
  const expiresAt = cookieStore.get(EXPIRES_AT_COOKIE_NAME)?.value;
  return expiresAt ? parseInt(expiresAt, 10) : null;
}

export async function isTokenExpired(): Promise<boolean> {
  const expiresAt = await getTokenExpiresAt();
  if (!expiresAt) return true;
  return Math.floor(Date.now() / 1000) > expiresAt - 60;
}

export async function clearTokens(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE_NAME);
  cookieStore.delete(REFRESH_TOKEN_COOKIE_NAME);
  cookieStore.delete(EXPIRES_AT_COOKIE_NAME);
  cookieStore.delete(PKCE_VERIFIER_COOKIE_NAME);
}
