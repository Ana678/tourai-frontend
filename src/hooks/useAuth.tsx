import { useEffect, useState, useContext, createContext, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { UserResponse } from "@/services/api/authService";

interface AuthContextType {
  user: UserResponse | null;
  loading: boolean;
  signIn: (token: string, user: UserResponse) => void; // Nova função para Login
  signOut: () => void;
  updateUserInStorage: (updatedUser: UserResponse) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser) as UserResponse);
      } catch {
        setUser(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  // Função chamada ao fazer Login com sucesso
  const signIn = (token: string, userData: UserResponse) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    navigate("/");
  };

  const signOut = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    navigate("/auth");
  };

  const updateUserInStorage = (updatedUser: UserResponse) => {
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, updateUserInStorage }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
