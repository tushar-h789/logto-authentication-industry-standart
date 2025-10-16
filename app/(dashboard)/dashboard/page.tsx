import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSession, handleLogout } from "@/lib/action/auth-actions";
import { getAccessToken } from "@/lib/utils/token-manager";
import { getIdToken } from "@/lib/utils/token-manager";
import { CopyButton } from "@/components/ui/copy-button";

export const metadata = {
  title: "Dashboard - Logto Auth",
  description: "User dashboard",
};

export default async function DashboardPage() {
  const session = await getSession();
  const [accessToken, idToken] = await Promise.all([
    getAccessToken(),
    getIdToken(),
  ]);
  const decodeIdTokenClaims = (() => {
    if (!idToken) return null;
    try {
      const parts = idToken.split(".");
      if (parts.length < 2) return null;
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64 + "===".slice((base64.length + 3) % 4);
      const json = Buffer.from(padded, "base64").toString("utf8");
      return JSON.parse(json);
    } catch {
      return null;
    }
  })();

  if (!session.isAuthenticated || !session.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <form action={handleLogout}>
            <Button type="submit" variant="outline">
              Logout
            </Button>
          </form>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-semibold">{session.user.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-semibold">{session.user.email || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Username</p>
                <p className="font-semibold">
                  {session.user.username || "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Email Verified</p>
                <div className="flex items-center mt-1">
                  <div
                    className={`w-3 h-3 rounded-full mr-2 ${
                      session.user.emailVerified
                        ? "bg-green-500"
                        : "bg-yellow-500"
                    }`}
                  />
                  <p className="font-semibold">
                    {session.user.emailVerified ? "Verified" : "Unverified"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">User ID</p>
                <p className="font-mono text-xs text-gray-600 break-all">
                  {session.user.id}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ID Token (contains user info)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">Raw ID Token (JWT)</p>
                  <CopyButton value={idToken} label="Copy" />
                </div>
                <pre className="text-xs p-3 bg-gray-100 rounded overflow-x-auto break-all">
                  {idToken || "N/A"}
                </pre>
              </div>
              <div>
                <p className="text-sm text-gray-500">Decoded ID Token Claims</p>
                <pre className="text-xs p-3 bg-gray-100 rounded overflow-x-auto break-words whitespace-pre-wrap">
                  {decodeIdTokenClaims
                    ? JSON.stringify(decodeIdTokenClaims, null, 2)
                    : "N/A"}
                </pre>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">Access Token</p>
                  <CopyButton value={accessToken} label="Copy" />
                </div>
                <pre className="text-xs p-3 bg-gray-100 rounded overflow-x-auto break-all">
                  {accessToken || "N/A"}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
