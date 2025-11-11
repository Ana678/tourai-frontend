import { useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, GripVertical, Clock, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useCreateItinerary } from "@/services/api/itinerariesService";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api/api";

type Atividade = {
  id: number;
  name: string;
  description?: string;
  location?: string;
  media_url?: string;
  tags?: string[];
};

type RoteiroResponse = {
  id: number;
  title: string;
  description?: string;
  tags?: string[];
  activities: Atividade[];
};

const Activity = ({
  name,
  local,
  day,
  time,
  onTimeChange,
  onDayChange,
  availableDays,
}: {
  name: string;
  local: string;
  day: number;
  time: string;
  onTimeChange: (time: string) => void;
  onDayChange: (day: number) => void;
  availableDays: number;
}) => {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-2">
          <div>
            <h4 className="font-semibold">{name}</h4>
            <p className="text-sm text-muted-foreground">{local}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm">Dia</Label>
              <select
                value={day}
                onChange={(e) => onDayChange(parseInt(e.target.value))}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                {Array.from({ length: availableDays }, (_, i) => i + 1).map(
                  (dia) => (
                    <option key={dia} value={dia}>
                      Dia {dia}
                    </option>
                  )
                )}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <Input
                type="time"
                value={time}
                onChange={(e) => onTimeChange(e.target.value)}
                className="w-32"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CreateItinerary = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mutate: createItinerary } = useCreateItinerary();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [activitiesTimes, setActivitiesTimes] = useState<
    { time: string; day: number }[]
  >([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { data: roadmap, isLoading } = useQuery<RoteiroResponse>({
    queryKey: ["roteiro", id, user?.id],
    queryFn: async () => {
      const response = await api.get(`/roadmaps/${id}`, {
        params: { userId: user?.id },
      });
      return response.data;
    },
    enabled: !!id && !!user?.id,
  });

  const handleTimeChange = (index: number, time: string) => {
    setActivitiesTimes((items) => {
      const newItems = [...items];

      newItems[index] = {
        ...items[index],
        time,
      };

      return newItems;
    });
  };

  const handleDayChange = (index: number, day: number) => {
    setActivitiesTimes((items) => {
      const newItems = [...items];

      newItems[index] = {
        ...items[index],
        day,
      };

      return newItems;
    });
  };

  const availableDays = useMemo(() => {
    if (!startDate || !endDate) return 1;
    const days =
      Math.ceil(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1;

    return days > 0 ? days : 1;
  }, [startDate, endDate]);

  const handleSave = () => {
    if (
      !startDate ||
      !endDate ||
      roadmap.activities.some((_, index) => !activitiesTimes[index]?.time)
    ) {
      toast({
        title: "Preencha todos os campos!",
        variant: "destructive",
      });

      return;
    }

    if (new Date(startDate).getTime() > new Date(endDate).getTime()) {
      toast({
        title: "A data de fim não pode ser anterior à data de início!",
        variant: "destructive",
      });

      return;
    }

    if (
      activitiesTimes.some((item, i) =>
        activitiesTimes.some(
          (other, j) =>
            i !== j && item.day === other.day && item.time === other.time
        )
      )
    ) {
      toast({
        title: "Não podem haver duas atividades no mesmo dia e horário!",
        variant: "destructive",
      });

      return;
    }

    const mappedActivities = roadmap.activities.map((item, index) => {
      const { day = 1, time } = activitiesTimes[index];

      const [hours, minutes] = time.split(":").map(Number);

      const date = new Date(startDate);
      date.setHours(date.getHours() + 3);
      date.setDate(date.getDate() + day - 1);
      date.setHours(hours, minutes);

      return { activityId: item.id, time: date.toISOString() };
    });

    if (
      mappedActivities.some(
        (item) => new Date(item.time).getTime() < new Date().getTime()
      )
    ) {
      toast({
        title: "Não é permitido preencher o itinerário com datas do passado!",
        variant: "destructive",
      });

      return;
    }

    setSaving(true);

    createItinerary(
      { roadmapId: roadmap.id, userId: user.id, activities: mappedActivities },
      {
        onSuccess: () => {
          toast({
            title: "Itinerário criado com sucesso!",
          });

          navigate("/itinerarios");
        },
        onError: () => {
          toast({
            title: "Erro inesperado ao criar itinerário.",
            variant: "destructive",
          });
        },
        onSettled: () => {
          setSaving(false);
        },
      }
    );
  };

  if (!user || isLoading) {
    return <div className="min-h-screen p-6">Carregando...</div>;
  }

  if (!roadmap || !roadmap?.activities?.length) {
    return <Navigate to="/roteiros" replace />;
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/roteiros")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Converter em Itinerário
          </h1>
          <p className="text-muted-foreground mt-1">{roadmap?.title}</p>
        </div>
      </div>

      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Data Início</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">Data Fim</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <h2 className="font-semibold">Atividades</h2>
        {roadmap.activities.map((activity, index) => (
          <Activity
            key={activity.id}
            day={activitiesTimes[index]?.day}
            time={activitiesTimes[index]?.time}
            local={activity.location}
            name={activity.name}
            onDayChange={(day) => handleDayChange(index, day)}
            onTimeChange={(time) => handleTimeChange(index, time)}
            availableDays={availableDays}
          />
        ))}
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
        <Save className="w-4 h-4" />
        {saving ? "Criando..." : "Criar Itinerário"}
      </Button>
    </div>
  );
};

export default CreateItinerary;
