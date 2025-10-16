"use server";

import { redirect } from "next/navigation";
import {
  storeTokens,
  getAccessToken,
  getRefreshToken,
  isTokenExpired,
  clearTokens,
} from "@/lib/utils/token-manager";
import {
  exchangeCodeForTokens,
  refreshAccessToken,
  fetchUserInfo,
} from "@/lib/services/logto-api";
import type { LogtoUser, AuthSession } from "@/lib/types/auth";
import crypto from "crypto";
import { cookies } from "next/headers";

// Helper function to convert base64 to base64url format
function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export async function generatePkce(): Promise<{ codeChallenge: string }> {
  const codeVerifier = base64UrlEncode(crypto.randomBytes(32));
  const codeChallenge = base64UrlEncode(
    crypto.createHash("sha256").update(codeVerifier).digest()
  );

  // Store verifier in HttpOnly cookie so it can be read in the callback route
  const cookieStore = await cookies();
  cookieStore.set("pkce_verifier", codeVerifier, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return { codeChallenge };
}

export async function handleLoginCallback(
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
  const tokenResponse = await exchangeCodeForTokens(
    code,
    codeVerifier,
    redirectUri
  );
  // console.log("token-response", tokenResponse);

  return {
    accessToken: tokenResponse.accessToken,
    refreshToken: tokenResponse.refreshToken,
    expiresIn: tokenResponse.expiresIn,
  };
}

export async function getCurrentUser(): Promise<LogtoUser | null> {
  try {
    let accessToken = await getAccessToken();

    if (!accessToken) {
      return null;
    }

    if (await isTokenExpired()) {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        await clearTokens();
        return null;
      }

      try {
        const refreshResponse = await refreshAccessToken(refreshToken);
        await storeTokens(
          refreshResponse.accessToken,
          refreshResponse.refreshToken,
          refreshResponse.expiresIn
        );
        accessToken = refreshResponse.accessToken;
      } catch (error) {
        console.error("Token refresh failed:", error);
        await clearTokens();
        return null;
      }
    }

    const userInfo = await fetchUserInfo(accessToken);
    return userInfo as LogtoUser;
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
}

export async function getSession(): Promise<AuthSession> {
  const user = await getCurrentUser();
  return {
    isAuthenticated: !!user,
    user: user || undefined,
  };
}

export async function handleLogout(): Promise<void> {
  // try {
  //   await clearTokens();
  //   redirect("/login");
  // } catch (error) {
  //   console.error("Logout error:", error);
  //   redirect("/login");
  // }
  await clearTokens();
  redirect("/login");
}
