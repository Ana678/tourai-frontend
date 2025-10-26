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
      {/* Hero Section */}
      <div className="gradient-hero rounded-2xl p-6 sm:p-8 text-primary-foreground">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          Bem-vindo de volta!
        </h1>
        <p className="text-primary-foreground/90">
          Planeje sua próxima aventura
        </p>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Atalhos Rápidos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {shortcuts.map((shortcut) => {
            const Icon = shortcut.icon;
            return (
              <Link key={shortcut.label} to={shortcut.path}>
                <Card className={`${shortcut.gradient} p-6 hover:shadow-medium transition-smooth cursor-pointer h-full`}>
                  <div className="flex flex-col items-center text-center gap-3 text-primary-foreground">
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

      {/* Recent Itineraries */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Últimos Itinerários</h2>
          <Link to="/itinerarios">
            <Button variant="ghost" size="sm">Ver todos</Button>
          </Link>
        </div>
        <div className="space-y-3">
          {recentItineraries.map((itinerary) => (
            <Card key={itinerary.id} className="p-4 hover:shadow-medium transition-smooth">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Map className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{itinerary.title}</h3>
                    <p className="text-sm text-muted-foreground">{itinerary.days} dias</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  itinerary.status === "Concluído" 
                    ? "bg-secondary/20 text-secondary" 
                    : "bg-accent/20 text-accent"
                }`}>
                  {itinerary.status}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recomendações</h2>
        <Card className="p-6 text-center space-y-3 border-dashed">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
            <Map className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">Explore novos destinos</h3>
            <p className="text-sm text-muted-foreground">
              Crie seu primeiro roteiro e comece a planejar
            </p>
          </div>
          <Link to="/roteiros/novo">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Criar Roteiro
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
};

export default Home;
