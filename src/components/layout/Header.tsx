import { Link, useLocation } from "react-router-dom";
import { Home, Map, Calendar, MessageSquare, User, LogOut, EarthIcon, Plane, Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Header = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Início" },
    { path: "/atividades", icon: EarthIcon, label: "Atividades" },
    { path: "/roteiros", icon: Map, label: "Roteiros" },
    { path: "/itinerarios", icon: Calendar, label: "Itinerários" },
    { path: "/postagens", icon: MessageSquare, label: "Postagens" },
    { path: "/notificacoes",  icon: Bell, label: "Notificações" },
    { path: "/perfil", icon: User, label: "Perfil" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-card border-b border-border shadow-soft sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
            <Link
                key={"/"}
                to={"/"}>
                <div className="flex items-center gap-2">
                    <Plane className="w-6 h-6 text-primary" />
                    <h1 className="text-lg font-bold text-foreground hidden sm:block">TourAI</h1>
                </div>
            </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-smooth ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
            <AuthActions />
          </nav>
        </div>
      </div>
    </header>
  );
};

const AuthActions = () => {
  const { user, signOut } = useAuth();

  if (!user) return null;

  return (
    <button
      onClick={() => signOut()}
      className="flex items-center gap-1 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
      title="Sair"
    >
      <LogOut className="w-5 h-5 text-red-500" />
    </button>
  );
};

export default Header;
