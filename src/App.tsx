import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MobileLayout from "./components/layout/MobileLayout";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

import { AuthProvider, useAuth } from "./hooks/useAuth";
import Posts from "./pages/Posts";
import Itineraries from "./pages/Itineraries";
import Itinerary from "./pages/Itinerary";
import CreateItinerary from "./pages/CreateItinerary";
import AvaliarItinerario from "./pages/AvaliarItinerario";

import Profile from "./pages/Profile";

import { queryClient } from "./services/api/api";
import Roteiros from "./pages/Roteiros";
import NovoRoteiro from "./pages/NovoRoteiro";
import EditarRoteiro from "./pages/EditarRoteiro";
import Atividades from "./pages/Atividades";
import NovaAtividade from "./pages/NovaAtividade";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Carregando...
      </div>
    );

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MobileLayout>
                    <Home />
                  </MobileLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/postagens"
              element={
                <ProtectedRoute>
                  <MobileLayout>
                    <Posts />
                  </MobileLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/avaliar-itinerario/:id"
              element={
                <ProtectedRoute>
                  <MobileLayout>
                    <AvaliarItinerario />
                  </MobileLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <MobileLayout>
                    <Profile />
                  </MobileLayout>
                </ProtectedRoute>
              }
            />
            <Route
                path="/itinerarios"
                element={
                <ProtectedRoute>
                    <MobileLayout>
                    <Itineraries />
                    </MobileLayout>
                </ProtectedRoute>
                }
            />
            <Route
                path="/itinerarios/:id"
                element={
                <ProtectedRoute>
                    <MobileLayout>
                    <Itinerary />
                    </MobileLayout>
                </ProtectedRoute>
                }
            />

        <Route
            path="/roteiros/:id/criar-itinerario"
            element={
            <ProtectedRoute>
                <MobileLayout>
                <CreateItinerary />
                </MobileLayout>
            </ProtectedRoute>
            }
        />

        <Route
            path="/roteiros"
            element={
              <ProtectedRoute>
                <MobileLayout>
                  <Roteiros />
                </MobileLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/roteiros/novo"
            element={
              <ProtectedRoute>
                <MobileLayout>
                  <NovoRoteiro />
                </MobileLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/roteiros/:id/editar"
            element={
              <ProtectedRoute>
                <MobileLayout>
                  <EditarRoteiro />
                </MobileLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/atividades"
            element={
              <ProtectedRoute>
                <MobileLayout>
                  <Atividades />
                </MobileLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/atividades/nova"
            element={
              <ProtectedRoute>
                <MobileLayout>
                  <NovaAtividade />
                </MobileLayout>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
