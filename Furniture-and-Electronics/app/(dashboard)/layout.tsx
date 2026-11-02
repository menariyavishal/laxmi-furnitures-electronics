import NextAuthSessionProvider from "@/components/dashboard/providers/SessionProvider";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import NotificationBell from "@/components/dashboard/NotificationBell";
import Sidebar from "@/components/dashboard/Sidebar";
import KeepAlive from "@/components/dashboard/KeepAlive";
import DashboardBackground from "@/components/dashboard/DashboardBackground";
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
        <div className="min-h-screen relative flex overflow-x-clip">
          {/* Fixed Dashboard Background Image with Frosted Readability Overlay */}
          <DashboardBackground src="/Minimalist White Hexagon Honeycomb.png" overlayOpacity={0.25} />

          {/* Sidebar */}
          <Sidebar isOwner={isOwner} />

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0 relative z-10">
            <header className="relative z-40 h-16 bg-[#0B1421] text-white shadow-sm flex items-center justify-between px-6 gap-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-4">
                <div className="md:hidden text-base font-bold text-white truncate max-w-[120px]">Laxmi</div>
                <DepartmentSwitcher />
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-slate-300 font-medium hidden sm:inline">
                  {session.user.role === "owner" ? "Welcome Suraj Menariya" : `Welcome ${session.user.name}`}
                </span>
                <NotificationBell />
                <Link
                  href="/api/auth/signout"
                  className="text-sm font-semibold text-rose-400 hover:text-rose-300 transition"
                >
                  Logout
                </Link>
              </div>
            </header>
            <main className="flex-1 p-6 relative">{children}</main>
          </div>
        </div>
      </DepartmentProvider>
    </NextAuthSessionProvider>
  );
}
