import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import {
  Home,
  Key,
  FileText,
  Zap,
  Images,
  History,
  Settings,
  User,
  Users,
} from "lucide-react";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "API Keys", href: "/api-setup", icon: Key },
  { name: "Batch Prompts", href: "/prompt-batch", icon: FileText },
  { name: "Geração", href: "/generation", icon: Zap },
  { name: "Resultados", href: "/results", icon: Images },
  { name: "Histórico", href: "/history", icon: History },
  { name: "Configurações", href: "/settings", icon: Settings },
];

const Sidebar = ({ open, onClose }: SidebarProps) => {
  const location = useLocation();
  const { user } = useAuth();
  const { data: userRole } = useUserRole(user?.id);

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform duration-300 lg:relative lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-border px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-foreground">VisionAI</span>
            <span className="text-xs text-muted-foreground">Image Generator</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}

          <div className="my-4 border-t border-border" />

          <Link
            to="/profile"
            className={cn(
              "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all",
              location.pathname === "/profile"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <User className="h-5 w-5" />
            Meu Perfil
          </Link>

          {userRole === "admin" && (
            <Link
              to="/admin/users"
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all",
                location.pathname === "/admin/users"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Users className="h-5 w-5" />
              Gerenciar Usuários
            </Link>
          )}
        </nav>

      </aside>
    </>
  );
};

export default Sidebar;
