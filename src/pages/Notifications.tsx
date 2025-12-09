import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Bell, UserPlus, Calendar, Heart, MessageCircle, 
  Check, X, Loader2, CheckCircle2 
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast"; 

import { 
  useGetNotifications, 
  useRespondInvite, 
  useMarkAsRead,
  NotificationType,
  NotificationResponse
} from "@/services/api/notificationService";

const TAB_REQUEST_TYPE: Record<string, NotificationType | null> = {
  todas: null,
  seguidores: NotificationType.FOLLOW,
  convites: NotificationType.ROADMAP_INVITATION,
  posts: null, 
};

const Notificacoes = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<string>("todas");

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetNotifications(user?.id, TAB_REQUEST_TYPE[activeTab]);

  const { mutate: respondInvite, isPending: isResponding } = useRespondInvite();
  const { mutate: markAsRead } = useMarkAsRead();

  const handleMarkAsRead = (notif: NotificationResponse) => {
    if (!notif.received) {
      markAsRead(notif.id);
    }
  };

  const handleInviteAction = (notif: NotificationResponse, action: "accept" | "reject") => {
    if (!notif.entityId) return;

    respondInvite(
      { entityId: notif.entityId, notificationId: notif.id, action },
      {
        onSuccess: () => {
          toast({
            title: action === "accept" ? "Convite aceito!" : "Convite recusado.",
            variant: "default",
          });
        },
        onError: () => {
          toast({
            title: "Erro ao processar convite",
            variant: "destructive",
          });
        }
      }
    );
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.FOLLOW: return <UserPlus className="w-3 h-3 text-white" />;
      case NotificationType.ROADMAP_INVITATION: return <Calendar className="w-3 h-3 text-white" />;
      case NotificationType.LIKE: return <Heart className="w-3 h-3 text-white" />;
      case NotificationType.COMMENT: return <MessageCircle className="w-3 h-3 text-white" />;
      default: return <Bell className="w-3 h-3 text-white" />;
    }
  };

  const getIconColor = (type: NotificationType) => {
    switch (type) {
      case NotificationType.FOLLOW: return "bg-blue-500";
      case NotificationType.ROADMAP_INVITATION: return "bg-purple-500";
      case NotificationType.LIKE: return "bg-red-500";
      case NotificationType.COMMENT: return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const renderContent = (notif: NotificationResponse) => {
    const sourceName = <span className="font-bold text-foreground">{notif.source.name}</span>;

    switch (notif.type) {
      case NotificationType.FOLLOW:
        return <p className="text-sm text-muted-foreground">{sourceName} começou a seguir você.</p>;
      
      case NotificationType.ROADMAP_INVITATION:
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {sourceName} convidou você para o itinerário <span className="font-medium text-foreground">"{notif.payload}"</span>.
            </p>
            
            {notif.actionCompleted ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded-md w-fit">
                <CheckCircle2 className="w-4 h-4" />
                <span>Respondido</span>
              </div>
            ) : (
              <div className="flex gap-3 mt-1">
                <Button 
                  size="sm" 
                  className="h-10 px-6 font-medium" 
                  onClick={() => handleInviteAction(notif, "accept")}
                  disabled={isResponding}
                >
                  <Check className="w-4 h-4 mr-2" /> Aceitar
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-10 px-6 font-medium"
                  onClick={() => handleInviteAction(notif, "reject")}
                  disabled={isResponding}
                >
                  <X className="w-4 h-4 mr-2" /> Recusar
                </Button>
              </div>
            )}
          </div>
        );

      case NotificationType.LIKE:
        return <p className="text-sm text-muted-foreground">{sourceName} curtiu sua publicação.</p>;
      
      case NotificationType.COMMENT:
        return (
          <p className="text-sm text-muted-foreground">
            {sourceName} comentou: <span className="italic">"{notif.payload}"</span>
          </p>
        );

      default:
        return <p className="text-sm text-muted-foreground">{sourceName} enviou uma notificação.</p>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', { 
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
    }).format(date);
  };

  const allNotifications = data?.pages.flatMap((page) => page) ?? [];

  const filteredNotifications = allNotifications.filter(notif => {
    if (activeTab === 'todas') return true;
    if (activeTab === 'seguidores') return notif.type === NotificationType.FOLLOW;
    if (activeTab === 'convites') return notif.type === NotificationType.ROADMAP_INVITATION;
    if (activeTab === 'posts') {
      return notif.type === NotificationType.LIKE || notif.type === NotificationType.COMMENT;
    }
    return true;
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Notificações</h1>
        <p className="text-muted-foreground mt-1">
          Suas atualizações recentes
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="seguidores">Seguidores</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="convites">Convites</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
           <Card className="p-8 text-center border-dashed bg-white">
             <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
             <p className="text-muted-foreground">
                {activeTab === "todas" 
                  ? "Você não tem notificações no momento" 
                  : `Você não tem notificações de ${activeTab}`}
             </p>
           </Card>
        ) : (
          filteredNotifications.map((notif) => (
            <Card 
              key={notif.id} 
              className={`p-4 transition-all relative ${
                !notif.received 
                  ? "bg-primary/5 border-primary/20" 
                  : "bg-white border-border shadow-sm"
              }`}
              onMouseEnter={() => handleMarkAsRead(notif)}
              onClick={() => handleMarkAsRead(notif)}
            >
              <div className="flex gap-4 cursor-default">
                <div className="relative shrink-0 w-10 h-10">
                  <Avatar className="w-full h-full border">
                    <AvatarImage src={notif.source.avatar_url || undefined} />
                    <AvatarFallback>{notif.source.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-background ${getIconColor(notif.type)}`}>
                    {getIcon(notif.type)}
                  </div>
                </div>

                <div className="flex-1 space-y-1">
                  <div onClick={(e) => e.stopPropagation()}>
                     {renderContent(notif)}
                  </div>
                  <p className="text-xs text-muted-foreground/60">
                    {formatDate(notif.createdAt)}
                  </p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {hasNextPage && (
        <div className="flex justify-center pt-4">
          <Button 
            variant="outline" 
            onClick={() => fetchNextPage()} 
            disabled={isFetchingNextPage}
            className="w-full sm:w-auto"
          >
            {isFetchingNextPage ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando...</>
            ) : (
              "Carregar mais antigas"
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Notificacoes;