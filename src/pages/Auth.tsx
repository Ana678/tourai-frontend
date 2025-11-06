import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plane } from "lucide-react";

import { useLoginUser, useRegisterUser } from "@/services/api/authService";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const registerMutation = useRegisterUser();
  const loginMutation = useLoginUser();

  const isLoading = registerMutation.isPending || loginMutation.isPending;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isLogin) {
        if (!email || !password) throw new Error("Preencha email e senha");

        loginMutation.mutate({ email, password }, {
          onSuccess: (userResponse) => {
            const userObj = {
              email: userResponse.email,
              nome: userResponse.name
            };
            localStorage.setItem("user", JSON.stringify(userObj));

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

        registerMutation.mutate({ name: nome, email, password }, {
          onSuccess: (userResponse) => {
            const userObj = { email: userResponse.email, nome: userResponse.name };
            localStorage.setItem("user", JSON.stringify(userObj));

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
          <h1 className="text-2xl font-bold">Roteiros de Viagem</h1>
          <p className="text-muted-foreground">
            {isLogin ? "Faça login para continuar" : "Crie sua conta"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
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
