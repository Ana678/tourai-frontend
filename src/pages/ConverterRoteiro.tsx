import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, GripVertical, Clock, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api/api";
import { useAuth } from "@/hooks/useAuth";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Tipos
type Atividade = {
  id: string;
  name: string;
  location: string;
  ordem?: number;
  horario: string;
  dia: number;
};

// Componente de Item Arrastável
const SortableAtividade = ({ atividade, onHorarioChange, onDiaChange, diasDisponiveis }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: atividade.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="bg-card border border-border rounded-lg p-4 touch-none">
      <div className="flex items-start gap-3">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing pt-1">
          <GripVertical className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1 space-y-2">
          <div><h4 className="font-semibold">{atividade.name}</h4><p className="text-sm text-muted-foreground">{atividade.location}</p></div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm">Dia</Label>
              <select value={atividade.dia} onChange={(e) => onDiaChange(atividade.id, parseInt(e.target.value))} className="h-9 rounded-md border bg-background px-3 text-sm">
                {Array.from({ length: diasDisponiveis }, (_, i) => i + 1).map((dia) => <option key={dia} value={dia}>Dia {dia}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" /><Input type="time" value={atividade.horario} onChange={(e) => onHorarioChange(atividade.id, e.target.value)} className="w-32" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ConverterRoteiro = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roteiro, setRoteiro] = useState<any>(null);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [local, setLocal] = useState("");
  const [diasDisponiveis, setDiasDisponiveis] = useState(1);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (id && user?.id) {
        fetchRoteiroData();
    }
  }, [id, user?.id]);

  const fetchRoteiroData = async () => {
    try {
      const { data } = await api.get(`/roadmaps/${id}`, {
        params: { userId: user?.id }
      });
      setRoteiro(data);
      
      if (data.activities) {
        const formatted = data.activities.map((a: any, index: number) => ({
          id: String(a.id),
          name: a.name,
          location: a.location,
          ordem: index,
          horario: "09:00",
          dia: 1,
        }));
        setAtividades(formatted);
      }
    } catch (error) {
      console.error(error);
      toast({ 
        title: "Erro ao carregar roteiro", 
        description: "Você não tem permissão ou o roteiro não existe.",
        variant: "destructive" 
      });
      navigate("/roteiros");
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setAtividades((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const updateAtividade = (id: string, field: keyof Atividade, value: any) => {
    setAtividades(items => items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleDataChange = (tipo: 'inicio' | 'fim', valor: string) => {
    if (tipo === 'inicio') {
      setDataInicio(valor);
      if (dataFim) setDiasDisponiveis(calcDias(valor, dataFim));
    } else {
      setDataFim(valor);
      if (dataInicio) setDiasDisponiveis(calcDias(dataInicio, valor));
    }
  };

  const calcDias = (inicio: string, fim: string) => {
    if (!inicio || !fim) return 1;
    // Cálculo seguro de dias entre datas
    const start = new Date(inicio);
    const end = new Date(fim);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  };

  const handleSave = async () => {
    if (!dataInicio || !dataFim) {
      toast({ title: "Preencha as datas", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      // 1. Calcular Datas Exatas para o Backend
      // O backend espera OffsetDateTime (ISO String)
      const atividadesPayload = atividades.map((ativ) => {
        // Cria a data baseada no input de "dataInicio"
        const dataBase = new Date(dataInicio);
        // Adiciona os dias (dia 1 = dataInicio, dia 2 = dataInicio + 1, etc)
        dataBase.setDate(dataBase.getDate() + (ativ.dia - 1));
        
        // Ajusta o horário
        const [horas, minutos] = ativ.horario.split(':').map(Number);
        dataBase.setHours(horas, minutos, 0, 0);

        return {
          activityId: Number(ativ.id),
          time: dataBase.toISOString() // Formato aceito pelo Java: "2023-12-10T09:00:00.000Z"
        };
      });

      // 2. Montar Payload Estrito conforme DTO Java
      const payload = {
        userId: user?.id,
        roadmapId: Number(id),
        activities: atividadesPayload
      };

      await api.post("/itineraries", payload);

      toast({ title: "Itinerário criado com sucesso!" });
      navigate("/itinerarios");
    } catch (error) {
      console.error(error);
      toast({ title: "Erro ao criar itinerário", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen p-6 flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/roteiros")}><ArrowLeft className="w-5 h-5" /></Button>
        <div><h1 className="text-2xl font-bold">Converter em Itinerário</h1><p className="text-muted-foreground">{roteiro?.title}</p></div>
      </div>

      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2"><Label>Data Início</Label><Input type="date" value={dataInicio} onChange={(e) => handleDataChange('inicio', e.target.value)} /></div>
          <div className="space-y-2"><Label>Data Fim</Label><Input type="date" value={dataFim} onChange={(e) => handleDataChange('fim', e.target.value)} /></div>
          <div className="space-y-2"><Label>Local</Label><Input value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Ex: Rio de Janeiro" /></div>
        </div>
      </Card>

      <div className="space-y-3">
        <h2 className="font-semibold">Atividades - Arraste para reordenar</h2>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={atividades.map((a) => a.id)} strategy={verticalListSortingStrategy}>
            {atividades.map((atividade) => (
              <SortableAtividade 
                key={atividade.id} 
                atividade={atividade} 
                onHorarioChange={(id: string, v: string) => updateAtividade(id, 'horario', v)} 
                onDiaChange={(id: string, v: number) => updateAtividade(id, 'dia', v)} 
                diasDisponiveis={diasDisponiveis} 
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full gap-2"><Save className="w-4 h-4" /> {saving ? "Criando..." : "Criar Itinerário"}</Button>
    </div>
  );
};

export default ConverterRoteiro;