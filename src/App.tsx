import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MobileLayout from "./components/layout/MobileLayout";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

import { AuthProvider, useAuth } from "./hooks/useAuth";
import Posts from "./pages/Posts";
import Itineraries from "./pages/Itineraries";
import CreateItinerary from "./pages/CreateItinerary";
import AvaliarItinerario from "./pages/AvaliarItinerarioMockado";

import Profile from "./pages/Profile";

const queryClient = new QueryClient();

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
                path="/roteiros/:id/criar-itinerario"
                element={
                <ProtectedRoute>
                    <MobileLayout>
                    <CreateItinerary />
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
