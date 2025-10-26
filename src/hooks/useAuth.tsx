import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
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

  return { user, loading, signOut };
};
