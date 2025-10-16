"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Lock } from "lucide-react";
import { generatePkce } from "@/lib/action/auth-actions";

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { codeChallenge } = await generatePkce();

      const endpointEnv = process.env.NEXT_PUBLIC_LOGTO_ENDPOINT || "";
      const endpoint = endpointEnv.replace(/\/+$/, ""); // remove trailing slash
      const appId = process.env.NEXT_PUBLIC_LOGTO_APP_ID;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
      // console.log("base url", baseUrl);

      const redirectUri = `${baseUrl}/callback`;
      // console.log("redirectURL", redirectUri);

      const authUrl = new URL(`${endpoint}/oidc/auth`);
      authUrl.searchParams.append("client_id", appId || "");
      authUrl.searchParams.append("redirect_uri", redirectUri);
      authUrl.searchParams.append("response_type", "code");
      authUrl.searchParams.append("scope", "openid profile email phone");
      authUrl.searchParams.append("code_challenge", codeChallenge);
      authUrl.searchParams.append("code_challenge_method", "S256");
      // Force the IdP to show the login screen even if an SSO session exists
      authUrl.searchParams.append("prompt", "login");
      authUrl.searchParams.append("max_age", "0");

      window.location.href = authUrl.toString();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initiate login");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 mx-auto">
            <Lock className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}
          <Button
            onClick={handleLogin}
            disabled={isLoading}
            size="lg"
            className="w-full"
          >
            {isLoading ? "Signing in..." : "Sign in with Logto"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
