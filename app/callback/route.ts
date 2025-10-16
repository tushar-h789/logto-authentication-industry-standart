import { handleLoginCallback } from "@/lib/action/auth-actions";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // console.log("=== CALLBACK ROUTE HIT ===");
    // console.log("Full Request URL:", request.url);

    const { searchParams } = new URL(request.url);
    // console.log("searchParams object:", searchParams.toString());

    const code = searchParams.get("code");
    const error = searchParams.get("error");
    // console.log("Received code:", code);
    // console.log("Received error:", error);

    if (error) {
      // console.warn("❌ OAuth error detected:", error);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code) {
      // console.warn("⚠️ No authorization code found in callback URL!");
      return NextResponse.redirect(
        new URL("/login?error=no_code", request.url)
      );
    }

    const codeVerifier = request.cookies.get("pkce_verifier")?.value;
    // console.log("PKCE code_verifier cookie:", codeVerifier);

    if (!codeVerifier) {
      // console.warn("⚠️ Missing PKCE verifier cookie!");
      return NextResponse.redirect(
        new URL("/login?error=no_verifier", request.url)
      );
    }

    const baseUrl = `${request.nextUrl.origin}`;
    // console.log("Detected base URL:", baseUrl);

    const redirectUri = `${baseUrl}/callback`;
    // console.log("Generated redirect URI:", redirectUri);

    // console.log("🚀 Calling handleLoginCallback...");
    const tokens = await handleLoginCallback(code, codeVerifier, redirectUri);
    // console.log("✅ handleLoginCallback completed successfully.", tokens);

    // Build redirect response and attach cookies so middleware sees them on /dashboard
    const res = NextResponse.redirect(new URL("/dashboard", request.url));

    const accessToken = tokens.accessToken;
    // console.log("accessssssssssssss", accessToken);

    // const tokenResponse = await exchangeCodeForTokens(
    //   code,
    //   codeVerifier,
    //   redirectUri
    // );
    // console.log("token-response", tokenResponse);

    const refreshToken = tokens.refreshToken;
    const expiresIn = tokens.expiresIn; // seconds
    const expiresAt = expiresIn
      ? Math.floor(Date.now() / 1000) + expiresIn
      : undefined;

    res.cookies.set("logto_token_set", accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      ...(expiresIn ? { maxAge: expiresIn } : {}),
    });

    if (refreshToken) {
      res.cookies.set("logto_refresh_token", refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
      });
    }

    if (expiresAt) {
      res.cookies.set("logto_expires_at", String(expiresAt), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: expiresIn ?? undefined,
      });
    }

    return res;
  } catch (error) {
    console.error("🔥 Callback error:", error);
    return NextResponse.redirect(
      new URL("/login?error=callback_failed", request.url)
    );
  }
}
