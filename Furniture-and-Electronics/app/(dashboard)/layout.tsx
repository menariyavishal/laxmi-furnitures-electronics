import NextAuthSessionProvider from "@/components/dashboard/providers/SessionProvider";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import NotificationBell from "@/components/dashboard/NotificationBell";
import Sidebar from "@/components/dashboard/Sidebar";
import KeepAlive from "@/components/dashboard/KeepAlive";
import { DepartmentProvider } from "@/components/dashboard/department/DepartmentContext";
import DepartmentSwitcher from "@/components/dashboard/department/DepartmentSwitcher";
import "./dashboard.css";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const isOwner = session.user.role === "owner";

  return (
    <NextAuthSessionProvider>
      <DepartmentProvider>
        <KeepAlive />
        <div className="min-h-screen bg-gray-100 flex">
          {/* Sidebar */}
          <Sidebar isOwner={isOwner} />

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 gap-4 border-b border-gray-200/70">
              <div className="flex items-center gap-4">
                <div className="md:hidden text-base font-bold text-black truncate max-w-[120px]">Laxmi</div>
                <DepartmentSwitcher />
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 font-medium hidden sm:inline">
                  {session.user.role === "owner" ? "Welcome Lalit Menariya" : `Welcome ${session.user.name}`}
                </span>
                <NotificationBell />
                <Link
                  href="/api/auth/signout"
                  className="text-sm font-medium text-red-600 hover:text-red-800"
                >
                  Logout
                </Link>
              </div>
            </header>
            <main className="flex-1 p-6">{children}</main>
          </div>
        </div>
      </DepartmentProvider>
    </NextAuthSessionProvider>
  );
}
