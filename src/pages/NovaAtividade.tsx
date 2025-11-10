import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAtividade, CreateAtividadeDTO } from "@/services/api/roteirosService";

// Tags de ATIVIDADE (características específicas)
const TAGS_ATIVIDADE = [
  "história",
  "cultura",
  "museu",
  "grátis",
  "compras",
  "artesanato",
  "monumento",
  "arquitetura",
  "vista",
  "pôr-do-sol",
  "aquário",
  "família",
  "animais",
  "praia",
  "relaxo",
  "esportes",
  "natureza",
  "trilha",
  "cachoeira",
  "parque",
  "piquenique",
  "restaurante",
  "café",
  "bar",
  "comida típica",
  "frutos do mar",
  "vegetariano",
  "noturno",
  "balada",
  "música ao vivo"
];

const NovaAtividade = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estados do formulário
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [tagsSelecionadas, setTagsSelecionadas] = useState<Set<string>>(new Set());

  // Criar atividade (mutação)
  const createAtividadeMutation = useMutation({
    mutationFn: (dto: CreateAtividadeDTO) => createAtividade(dto, userId!),
    onSuccess: () => {
      toast({
        title: "Atividade criada!",
        description: "Sua atividade foi criada com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["atividades", userId] });
      navigate("/atividades");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar atividade",
        description: error.message || "Erro inesperado ao salvar.",
        variant: "destructive",
      });
    },
  });

  const loading = createAtividadeMutation.isPending;

  // Alternar seleção de tags
  const toggleTag = (tag: string) => {
    if (loading) return;
    const newSet = new Set(tagsSelecionadas);
    if (newSet.has(tag)) {
      newSet.delete(tag);
    } else {
      newSet.add(tag);
    }
    setTagsSelecionadas(newSet);
  };

  // Enviar formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      toast({
        title: "Erro de autenticação",
        description: "Usuário não encontrado, tente relogar.",
        variant: "destructive",
      });
      return;
    }

    if (!nome.trim() || !localizacao.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha nome e localização",
        variant: "destructive",
      });
      return;
    }

    createAtividadeMutation.mutate({
      name: nome.trim(),
      description: descricao.trim() || "",
      location: localizacao.trim(),
      tags: Array.from(tagsSelecionadas),
    });
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/atividades")}
          disabled={loading}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Nova Atividade</h1>
          <p className="text-muted-foreground mt-1">
            Adicione uma nova atividade ao seu repertório
          </p>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Atividade *</Label>
            <Input
              id="nome"
              placeholder="Ex: Museu Câmara Cascudo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              placeholder="Descreva a atividade..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={4}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="localizacao">Localização *</Label>
            <Input
              id="localizacao"
              placeholder="Ex: Av. Hermes da Fonseca, 1398 - Tirol, Natal - RN"
              value={localizacao}
              onChange={(e) => setLocalizacao(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {/* Tags da ATIVIDADE */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <Label>Características da Atividade</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Selecione as tags que descrevem esta atividade
            </p>
            <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto p-2 border rounded-lg">
              {TAGS_ATIVIDADE.map((tag) => (
                <Badge
                  key={tag}
                  variant={tagsSelecionadas.has(tag) ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${
                    loading ? "cursor-not-allowed opacity-60" : "hover:scale-105"
                  }`}
                  onClick={() => !loading && toggleTag(tag)}
                >
                  {tagsSelecionadas.has(tag) && "✓ "}
                  {tag}
                </Badge>
              ))}
            </div>
            {tagsSelecionadas.size > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {tagsSelecionadas.size} {tagsSelecionadas.size === 1 ? "tag selecionada" : "tags selecionadas"}
              </p>
            )}
          </div>
        </Card>

        {/* Ações */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => navigate("/atividades")}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" className="flex-1 gap-2" disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {loading ? "Salvando..." : "Salvar Atividade"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NovaAtividade;