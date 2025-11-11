import { useEffect, useState, useContext, createContext, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { UserResponse } from "@/services/api/authService"; // Importe a interface que já criamos

// 1. Defina uma interface para o valor do contexto
interface AuthContextType {
  user: UserResponse | null;
  loading: boolean;
  signOut: () => void;
  updateUserInStorage: (updatedUser: UserResponse) => void; // A função que estava faltando
}

// 2. Crie o contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Crie o Provedor (AuthProvider)
// Este componente irá envolver sua aplicação
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        // Use a interface UserResponse para tipar o usuário
        setUser(JSON.parse(stored) as UserResponse);
      } catch {
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const signOut = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/auth");
  };

  // 4. Defina a função que será compartilhada
  const updateUserInStorage = (updatedUser: UserResponse) => {
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser); // Atualiza o estado global
  };

  // 5. Forneça o usuário e as funções para os componentes filhos
  return (
    <AuthContext.Provider value={{ user, loading, signOut, updateUserInStorage }}>
      {children}
    </AuthContext.Provider>
  );
};

// 6. Crie o Hook (useAuth)
// Este é o hook que os componentes usarão
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  // Agora ele retorna o valor completo do contexto
  return context;
};
