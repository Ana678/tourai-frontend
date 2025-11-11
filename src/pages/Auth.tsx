import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea"; // Importar Textarea
import { useToast } from "@/hooks/use-toast";
import { Plane, X } from "lucide-react"; // Importar X

import { useLoginUser, useRegisterUser } from "@/services/api/authService";
import { useAuth } from "@/hooks/useAuth";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");

  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [interesses, setInteresses] = useState<string[]>([]);
  const [interesseInput, setInteresseInput] = useState("");

  const navigate = useNavigate();
  const { toast } = useToast();

  const { updateUserInStorage } = useAuth();
  const registerMutation = useRegisterUser();
  const loginMutation = useLoginUser();

  const isLoading = registerMutation.isPending || loginMutation.isPending;

  // Funções helper do Auth02.tsx
  const addInteresse = () => {
    if (interesseInput.trim() && !interesses.includes(interesseInput.trim())) {
      setInteresses([...interesses, interesseInput.trim()]);
      setInteresseInput("");
    }
  };

  const removeInteresse = (interesse: string) => {
    setInteresses(interesses.filter((i) => i !== interesse));
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isLogin) {
        // --- LÓGICA DE LOGIN ---
        if (!email || !password) throw new Error("Preencha email e senha");

        loginMutation.mutate({ email, password }, {
          onSuccess: (userResponse) => {
            updateUserInStorage(userResponse);
            toast({ title: "Login realizado com sucesso!" });
            navigate("/");
          },
          onError: (error: any) => {
            const responseData = error?.response?.data;
            const errorMsg =
            (typeof responseData === "object" && (responseData.body || responseData.message)) ||
            (typeof responseData === "string" && responseData) ||
            error?.message ||
            String(error);
            toast({
                title: "Erro no Login",
                description: String(errorMsg || "Não foi possível realizar o login."),
                variant: "destructive",
            });
          }
        });

      } else {
        // --- LÓGICA DE REGISTRO ---
        registerMutation.mutate({
          name: nome,
          email,
          password,
          // Envia os campos opcionais para o backend
          // O backend (UserService.java) já espera por eles
          profilePhotoUrl: avatarUrl || undefined,
          bio: bio || undefined,
          interests: interesses.length > 0 ? interesses : undefined
        }, {
          onSuccess: (userResponse) => {
            // A userResponse também contém os dados completos no cadastro
            updateUserInStorage(userResponse);
            toast({ title: "Conta criada com sucesso!" });
            navigate("/");
          },
          onError: (error: any) => {
            const responseData = error?.response?.data;
            const errorMsg =
            (typeof responseData === "object" && (responseData.body || responseData.message)) ||
            (typeof responseData === "string" && responseData) ||
            error?.message ||
            String(error);
            toast({
                title: "Erro no Cadastro",
                description: String(errorMsg || "Não foi possível criar a conta."),
                variant: "destructive",
            });
          }
        });
      }
    } catch (error: any) {
        const responseData = error?.response?.data;
        const errorMsg =
        (typeof responseData === "object" && (responseData.body || responseData.message)) ||
        (typeof responseData === "string" && responseData) ||
        error?.message ||
        String(error);

        toast({
            title: "Erro",
            description: String(errorMsg),
            variant: "destructive",
        });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-primary">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Plane className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">TourAI</h1>
          <p className="text-muted-foreground">
            {isLogin ? "Faça login para continuar" : "Crie sua conta"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  placeholder="Seu nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatarUrl">Foto de Perfil (URL) - Opcional</Label>
                <Input
                  id="avatarUrl"
                  placeholder="https://exemplo.com/foto.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  type="url"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio - Opcional</Label>
                <Textarea
                  id="bio"
                  placeholder="Conte um pouco sobre você..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interesses">Interesses - Opcional</Label>
                <div className="flex gap-2">
                  <Input
                    id="interesses"
                    placeholder="Ex: Praia, Cultura, Aventura"
                    value={interesseInput}
                    onChange={(e) => setInteresseInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addInteresse())}
                    disabled={isLoading}
                  />
                  <Button type="button" onClick={addInteresse} variant="outline" disabled={isLoading}>
                    Adicionar
                  </Button>
                </div>
                {interesses.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {interesses.map((interesse) => (
                      <span
                        key={interesse}
                        className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full flex items-center gap-1"
                      >
                        {interesse}
                        <button
                          type="button"
                          onClick={() => removeInteresse(interesse)}
                          className="hover:text-destructive"
                          disabled={isLoading}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={isLoading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Carregando..." : isLogin ? "Entrar" : "Criar conta"}
          </Button>
        </form>

        <div className="text-center text-sm">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:underline"
            disabled={isLoading}
          >
            {isLogin
              ? "Não tem conta? Cadastre-se"
              : "Já tem conta? Faça login"}
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Auth;
