import { type ReactNode, useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/context/AuthContext";
import {
  Car,
  Home,
  Clock,
  User,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  BarChart3,
  Truck,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Activity
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

function getNavItems(role: string): NavItem[] {
  if (role === "customer") {
    return [
      { label: "Book Ride", href: "/", icon: <Car size={18} /> },
      { label: "Rentals", href: "/rentals", icon: <Calendar size={18} /> },
      { label: "History", href: "/history", icon: <Clock size={18} /> },
      { label: "Profile", href: "/profile", icon: <User size={18} /> },
    ];
  }
  if (role === "driver") {
    return [
      { label: "Dashboard", href: "/driver", icon: <Home size={18} /> },
      { label: "Available Rides", href: "/driver/rides", icon: <MapPin size={18} /> },
      { label: "Earnings", href: "/driver/earnings", icon: <DollarSign size={18} /> },
    ];
  }
  if (role === "admin") {
    return [
      { label: "Dashboard", href: "/admin", icon: <BarChart3 size={18} /> },
      { label: "Users", href: "/admin/users", icon: <Users size={18} /> },
      { label: "Drivers", href: "/admin/drivers", icon: <User size={18} /> },
      { label: "Rides", href: "/admin/rides", icon: <Activity size={18} /> },
      { label: "Vehicles", href: "/admin/vehicles", icon: <Truck size={18} /> },
      { label: "Analytics", href: "/admin/analytics", icon: <BarChart3 size={18} /> },
    ];
  }
  return [];
}

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return <>{children}</>;

  const navItems = getNavItems(user.role);

  const roleColor = {
    customer: "text-yellow-500",
    driver: "text-blue-500",
    admin: "text-purple-500",
  }[user.role];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 py-5 border-b border-sidebar-border">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Car size={16} className="text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-sidebar-foreground tracking-tight">RideNow</span>
          <button
            className="ml-auto md:hidden text-sidebar-foreground/60"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
              <p className={`text-xs font-medium capitalize ${roleColor}`}>{user.role}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <span className={isActive ? "text-primary-foreground" : "text-sidebar-foreground/60 group-hover:text-sidebar-accent-foreground"}>
                  {item.icon}
                </span>
                {item.label}
                {isActive && <ChevronRight size={14} className="ml-auto opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-sidebar-border">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive w-full transition-colors"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="flex md:hidden items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-foreground/60"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
              <Car size={12} className="text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">RideNow</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
