import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSession, handleLogout } from "@/lib/action/auth-actions";

export const metadata = {
  title: "Dashboard - Logto Auth",
  description: "User dashboard",
};

export default async function DashboardPage() {
  const session = await getSession();

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
        </div>
      </main>
    </div>
  );
}
