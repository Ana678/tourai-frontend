import { Plus, Map, Calendar, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Home = () => {
  const recentItineraries = [
    { id: 1, title: "Lisboa em 3 dias", days: 3, status: "Concluído" },
    { id: 2, title: "Porto e Douro", days: 5, status: "Em andamento" },
  ];

  const shortcuts = [
    {
      icon: Plus,
      label: "Criar Roteiro",
      path: "/roteiros/novo",
      gradient: "gradient-primary"
    },
    {
      icon: Calendar,
      label: "Meus Itinerários",
      path: "/itinerarios",
      gradient: "gradient-hero"
    },
    {
      icon: MessageSquare,
      label: "Postagens",
      path: "/postagens",
      gradient: "gradient-primary"
    },
  ];

  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-6">
      <div className="gradient-hero rounded-2xl p-6 sm:p-8 text-primary-foreground">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          Bem-vindo de volta!
        </h1>
        <p className="text-primary-foreground/90">
          Planeje sua próxima aventura
        </p>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-4">Atalhos Rápidos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {shortcuts.map((shortcut) => {
            const Icon = shortcut.icon;
            return (
              <Link key={shortcut.label} to={shortcut.path}>
                <Card className={`${shortcut.gradient} p-6 hover:shadow-medium transition-smooth cursor-pointer h-full`}>
                  <div className="flex flex items-center text-center gap-3 text-primary-foreground">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="font-semibold">{shortcut.label}</span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Home;
