import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, GripVertical, Clock, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type ActivityState = {
  activityId: number;
  time: string;
  dayNumber: number;
};

type Roteiro = {
  id: string;
  titulo: string;
  descricao: string | null;
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

const roteiro = {
  id: 1,
  title: "Minhas Férias em Natal",
  description: null,
  tags: [],
  visibility: "PUBLIC",
  status: "PENDING",
  owner: {
    id: 1,
    name: "Ádisson",
    email: "adisson@gmail.com",
  },
  activities: [
    {
      id: 5,
      name: "Feirinha de Ponta Negra",
      description: null,
      location: "Praça da Praia de Ponta Negra",
      mediaUrl: null,
      tags: ["compras", "artesanato"],
      type: "CUSTOM_PUBLIC",
      moderationStatus: "PENDING",
      creator: {
        id: 1,
        name: "Ádisson",
        email: "adisson@gmail.com",
      },
    },
    {
      id: 4,
      name: "Museu Câmara Cascudo",
      description: null,
      location: "Av. Hermes da Fonseca, 1398 - Tirol, Natal - RN",
      mediaUrl: null,
      tags: ["história", "cultura", "museu"],
      type: "SYSTEM",
      moderationStatus: "APPROVED",
      creator: null,
    },
  ],
};

const CreateItinerary = () => {
  //const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activitiesTimes, setActivitiesTimes] = useState<
    { time: string; day: number }[]
  >([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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

  const handleSave = async () => {};

  if (loading) {
    return <div className="min-h-screen p-6">Carregando...</div>;
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
          <p className="text-muted-foreground mt-1">{roteiro?.title}</p>
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
        <h2 className="font-semibold">activities - Arraste para reordenar</h2>
        {roteiro.activities.map((activity, index) => (
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
