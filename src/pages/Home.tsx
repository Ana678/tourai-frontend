// src/pages/Home.tsx
import { useState } from "react";
import { Plus, Map, Calendar, MessageSquare, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { getAIRecommendations } from "@/services/api/aiService";

import ModalCriarRoteiro from "@/components/layout/ModalCriarRoteiro";

const Home = () => {
  const { user } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState(null);

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

  const { data: recommendations, isLoading: loadingRecommendations } = useQuery({
    queryKey: ['ai-recommendations', user?.id],
    queryFn: () => getAIRecommendations(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 60 * 24,
  });

  const handleUseIdea = (idea: any) => {
    setSelectedIdea(idea);
    setModalOpen(true);
  };

  return (
    <>
      <div className="min-h-screen p-4 sm:p-6 space-y-6 relative">
        <div className="gradient-hero rounded-2xl p-6 sm:p-8 text-primary-foreground">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Bem-vindo de volta, {user?.name?.split(' ')[0]}!
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
                    <div className="flex items-center text-center gap-3 text-primary-foreground">
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

        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            <h2 className="text-xl font-semibold">Sugestões para você</h2>
          </div>

          {loadingRecommendations ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6 h-48 animate-pulse bg-muted/50" />
              ))}
            </div>
          ) : recommendations && recommendations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {recommendations.map((rec: any, index: number) => (
                <Card key={index} className="flex flex-col p-5 hover:shadow-md transition-smooth border-primary/20 bg-card/50 backdrop-blur-sm">
                  <div className="mb-3">
                    <h3 className="font-semibold text-lg leading-tight mb-2 text-foreground">{rec.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {rec.description}
                    </p>
                  </div>

                  <div className="mt-auto space-y-4">
                    <div className="flex flex-wrap gap-1.5">
                      {rec.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-[10px] font-normal">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full gap-2 text-primary hover:text-primary hover:bg-primary/10 group"
                      onClick={() => handleUseIdea(rec)}
                    >
                      Usar esta ideia <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center space-y-4 border-dashed bg-muted/30">
              <div className="w-16 h-16 rounded-full bg-background border mx-auto flex items-center justify-center">
                <Map className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Explore novos destinos</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Adicione interesses ao seu perfil ou crie atividades para receber recomendações personalizadas da nossa IA.
                </p>
              </div>
              <Link to="/roteiros/novo">
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Criar Primeiro Roteiro
                </Button>
              </Link>
            </Card>
          )}
        </div>
      </div>

      <ModalCriarRoteiro
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        dadosIniciais={selectedIdea}
      />
    </>
  );
};

export default Home;
