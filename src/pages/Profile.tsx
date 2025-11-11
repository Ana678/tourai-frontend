import { useEffect, useState } from "react";
import { User, Map, Calendar, MessageSquare, Settings, LogOut, X, Edit, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useUpdateUser } from "@/services/api/authService";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api/api";


type UserStatsResponse = {
  roteiros: number;
  itinerarios: number;
  postagens: number;
};

const fetchUserStats = async (userId: number): Promise<UserStatsResponse> => {
  const response = await api.get(`/users/${userId}/stats`);
  return response.data;
};

const Profile = () => {
  const { user, signOut, updateUserInStorage } = useAuth();
  const { toast } = useToast();
  const updateUserMutation = useUpdateUser();
  const isLoadingMutation = updateUserMutation.isPending;

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    nome: "",
    avatar_url: "",
    bio: "",
    interesses: [] as string[],
  });
  const [interesseInput, setInteresseInput] = useState("");

  const {
    data: statsData,
    isLoading: isLoadingStats,
    isError: isErrorStats
  } = useQuery<UserStatsResponse>({
    queryKey: ["userStats", user?.id],
    queryFn: () => fetchUserStats(user!.id),
    enabled: !!user?.id,
  });

  const stats = [
    { label: "Roteiros", value: statsData?.roteiros ?? 0, icon: Map },
    { label: "Itinerários", value: statsData?.itinerarios ?? 0, icon: Calendar },
    { label: "Postagens", value: statsData?.postagens ?? 0, icon: MessageSquare },
  ];

  useEffect(() => {
    if (isEditing && user) {
      setEditData({
        nome: user.name || "",
        avatar_url: user.profilePhotoUrl || "",
        bio: user.bio || "",
        interesses: user.interests || [],
      });
    }
  }, [isEditing, user]);

  const addInteresse = () => {
    if (interesseInput.trim() && !editData.interesses.includes(interesseInput.trim())) {
      setEditData({ ...editData, interesses: [...editData.interesses, interesseInput.trim()] });
      setInteresseInput("");
    }
  };

  const removeInteresse = (interesse: string) => {
    setEditData({ ...editData, interesses: editData.interesses.filter((i) => i !== interesse) });
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    updateUserMutation.mutate(
      {
        id: user.id,
        data: {
          name: editData.nome,
          email: user.email,
          profilePhotoUrl: editData.avatar_url || undefined,
          bio: editData.bio || undefined,
          interests: editData.interesses.length > 0 ? editData.interesses : undefined,
        },
      },
      {
        onSuccess: (updatedUser) => {
          updateUserInStorage(updatedUser);
          toast({ title: "Perfil atualizado com sucesso!" });
          setIsEditing(false);
        },
        onError: (error: any) => {
          const responseData = error?.response?.data;
          const errorMsg =
            (typeof responseData === "object" && (responseData.body || responseData.message)) ||
            (typeof responseData === "string" && responseData) ||
            error?.message ||
            String(error);
          toast({
            title: "Erro ao atualizar perfil",
            description: String(errorMsg || "Não foi possível salvar."),
            variant: "destructive",
          });
        },
      }
    );
  };

  if (!user || isLoadingStats) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (isErrorStats) {
    toast({
        title: "Erro ao carregar estatísticas",
        description: "Não foi possível carregar os totais de roteiros, itinerários e postagens.",
        variant: "destructive"
    })
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Header com gradient */}
      <div className="gradient-primary p-6 sm:p-8 pb-20">
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" className="gap-2" onClick={signOut}>
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="px-4 sm:px-6 -mt-16">
        <Card className="p-6 shadow-medium">
          <div className="flex flex-col items-center text-center space-y-4">
            <Avatar className="w-24 h-24 border-4 border-background">
              <AvatarImage src={user.profilePhotoUrl || undefined} />
              <AvatarFallback>{user.name?.[0] || "?"}</AvatarFallback>
            </Avatar>

            <div>
              <h1 className="text-2xl font-bold">{user.name || "Usuário"}</h1>
              <p className="text-muted-foreground">{user.email}</p>
            </div>

            <Dialog open={isEditing} onOpenChange={setIsEditing}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Edit className="w-4 h-4" />
                  Editar Perfil
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Editar Perfil</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-nome">Nome</Label>
                    <Input
                      id="edit-nome"
                      value={editData.nome}
                      onChange={(e) => setEditData({ ...editData, nome: e.target.value })}
                      disabled={isLoadingMutation}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-avatar">Foto de Perfil (URL)</Label>
                    <Input
                      id="edit-avatar"
                      placeholder="https://exemplo.com/foto.jpg"
                      value={editData.avatar_url}
                      onChange={(e) => setEditData({ ...editData, avatar_url: e.target.value })}
                      disabled={isLoadingMutation}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-bio">Bio</Label>
                    <Textarea
                      id="edit-bio"
                      placeholder="Conte um pouco sobre você..."
                      value={editData.bio}
                      onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                      rows={4}
                      disabled={isLoadingMutation}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-interesses">Interesses</Label>
                    <div className="flex gap-2">
                      <Input
                        id="edit-interesses"
                        placeholder="Adicionar interesse"
                        value={interesseInput}
                        onChange={(e) => setInteresseInput(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addInteresse())}
                        disabled={isLoadingMutation}
                      />
                      <Button type="button" onClick={addInteresse} variant="outline" size="sm" disabled={isLoadingMutation}>
                        Adicionar
                      </Button>
                    </div>
                    {editData.interesses.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {editData.interesses.map((interesse) => (
                          <span
                            key={interesse}
                            className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full flex items-center gap-1"
                          >
                            {interesse}
                            <button
                              type="button"
                              onClick={() => removeInteresse(interesse)}
                              className="hover:text-destructive"
                              disabled={isLoadingMutation}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button onClick={handleSaveProfile} className="w-full gap-2" disabled={isLoadingMutation}>
                    {isLoadingMutation && <Loader2 className="w-4 h-4 animate-spin" />}
                    Salvar Alterações
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </Card>
      </div>

      {/* Stats */}
      <div className="p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="p-4 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Bio */}
        {user.bio && (
          <Card className="p-6">
            <h2 className="font-semibold mb-3">Sobre</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {user.bio}
            </p>
          </Card>
        )}

        {/* Preferências */}
        {user.interests && user.interests.length > 0 && (
          <Card className="p-6">
            <h2 className="font-semibold mb-3">Interesses de Viagem</h2>
            <div className="flex flex-wrap gap-2">
              {user.interests.map((interesse: string) => (
                <span
                  key={interesse}
                  className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
                >
                  {interesse}
                </span>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Profile;
