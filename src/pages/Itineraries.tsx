import { useState, useEffect, useMemo, useRef } from "react";
import { Calendar, Clock, Check, Play, Star, Search } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ItineraryDTO,
  useGetItineraries,
} from "@/services/api/itinerariesService";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";

const Itineraries = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState("");
  const [type, setType] = useState<"ALL" | "OWNED" | "PARTICIPATING">("ALL");

  const initialRender = useRef(true);

  const page = useMemo(() => {
    const pageParam = Number(searchParams.get("page") ?? 1);

    return isNaN(pageParam) || pageParam < 1 ? 0 : pageParam - 1;
  }, [searchParams]);

  const { data: itineraries, isLoading } = useGetItineraries({
    userId: user?.id,
    search: search === "" ? undefined : search,
    type: type === "ALL" ? undefined : type,
    page,
    size: 12,
  });
  const { toast } = useToast();

  useEffect(() => {
    setSearchParams((prev) => {
      if (page !== 0 && !initialRender.current) {
        prev.set("page", "1");
      }
      return prev;
    });

    initialRender.current = false;
  }, [search, type]);

  useEffect(() => {
    const pageParam = Number(searchParams.get("page") ?? 1);

    if (
      isNaN(pageParam) ||
      pageParam < 1 ||
      (!isLoading && page >= itineraries?.totalPages)
    ) {
      setSearchParams((prev) => {
        prev.set("page", "1");
        return prev;
      });
    }
  }, [searchParams, itineraries]);

  const getStartDate = (itinerary: ItineraryDTO) => {
    return itinerary.activities.reduce<Date>((acc, curr) => {
      if (
        acc === null ||
        new Date(acc).getTime() > new Date(curr.time).getTime()
      ) {
        return new Date(curr.time);
      }

      return acc;
    }, null);
  };

  const getEndDate = (itinerary: ItineraryDTO) => {
    return itinerary.activities.reduce<Date>((acc, curr) => {
      if (
        acc === null ||
        new Date(acc).getTime() < new Date(curr.time).getTime()
      ) {
        return new Date(curr.time);
      }

      return acc;
    }, null);
  };

  const getTotalDays = (itinerary: ItineraryDTO) => {
    const startDate = getStartDate(itinerary);
    const endDate = getEndDate(itinerary);

    if (!startDate || !endDate) {
      return 0;
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    return Math.ceil(diffDays) + 1;
  };

  const getStatus = (
    itinerary: ItineraryDTO
  ): "planned" | "in_progress" | "concluded" => {
    const startDate = getStartDate(itinerary);

    if (!startDate) {
      return null;
    }

    if (
      new Date().getTime() < new Date(startDate).getTime() &&
      itinerary.activities.every((item) => !item.completed)
    ) {
      return "planned";
    } else if (itinerary.activities.some((item) => !item.completed)) {
      return "in_progress";
    } else {
      return "concluded";
    }
  };

  const getStatusBadge = (itinerary: ItineraryDTO) => {
    const status = getStatus(itinerary);

    switch (status) {
      case "planned":
        return <Badge variant="outline">Planejado</Badge>;
      case "in_progress":
        return (
          <Badge className="bg-accent text-accent-foreground">
            Em andamento
          </Badge>
        );
      case "concluded":
        return (
          <Badge className="bg-secondary text-secondary-foreground">
            Concluído
          </Badge>
        );
      default:
        return null;
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!itineraries?.first && page > 0)
      setSearchParams((prev) => {
        prev.set("page", (page - 1).toString());
        return prev;
      });
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!itineraries?.last && page < (itineraries?.totalPages ?? 1) - 1)
      setSearchParams((prev) => {
        prev.set("page", (page + 1).toString());
        return prev;
      });
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Meus Itinerários</h1>
        <p className="text-muted-foreground mt-1">
          Organize suas atividades por dias e horários
        </p>
      </div>

      {/* Filtros */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar itinerários..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white dark:bg-card"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["ALL", "OWNED", "PARTICIPATING"] as const).map((item) => (
            <Button
              key={item}
              variant={item === type ? "default" : "outline"}
              size="sm"
              onClick={() => setType(item)}
            >
              {item === "ALL" && "Todos"}
              {item === "OWNED" && "Criados por mim"}
              {item === "PARTICIPATING" && "Compartilhados comigo"}
            </Button>
          ))}
        </div>
      </div>

      {/* Lista de itinerários */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="p-6">Carregando...</div>
        ) : (
          itineraries?.content?.map((itinerary) => (
            <Card
              key={itinerary.id}
              className="overflow-hidden hover:shadow-medium transition-smooth h-full cursor-pointer"
              onClick={() => navigate(`/itinerarios/${itinerary.id}`)}
            >
              <div className="h-32 gradient-primary flex items-center justify-center">
                <Calendar className="w-12 h-12 text-primary-foreground" />
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg line-clamp-1">
                      {itinerary.roadmap.title}
                    </h3>
                    {getStatusBadge(itinerary)}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{getTotalDays(itinerary)} dia(s)</span>
                  </div>
                  <span>•</span>
                  <span>{itinerary.activities.length} atividade(s)</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground">
                    Início:{" "}
                    {getStartDate(itinerary)?.toLocaleDateString("pt-BR") ??
                      "-"}
                  </span>
                </div>
                {getStatus(itinerary) === "concluded" && (
                  <div
                    className="p-0 pt-0 border-t border-border/0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      asChild
                      variant="secondary"
                      className="w-full gap-2 mt-2"
                    >
                      <Link to={`/avaliar-itinerario/${itinerary.id}`}>
                        <Star className="w-4 h-4 fill-secondary-foreground" />
                        Avaliar Itinerário
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Paginação */}
      {!isLoading && itineraries?.content?.length > 0 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={handlePrev}
                aria-disabled={itineraries?.first}
                className={
                  itineraries?.first ? "opacity-50 pointer-events-none" : ""
                }
              />
            </PaginationItem>

            {Array.from({ length: itineraries.totalPages }).map((_, idx) => (
              <PaginationItem key={idx}>
                <PaginationLink
                  href="#"
                  isActive={idx === page}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSearchParams((prev) => {
                      prev.set("page", (idx + 1).toString());
                      return prev;
                    });
                  }}
                >
                  {idx + 1}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={handleNext}
                aria-disabled={itineraries?.last}
                className={
                  itineraries?.last ? "opacity-50 pointer-events-none" : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Empty state */}
      {!isLoading && !itineraries?.content?.length && (
        <Card className="p-8 text-center space-y-4 border-dashed">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
            <Calendar className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold mb-2">
              Nenhum itinerário{" "}
              {type === "PARTICIPATING" ? "compartilhado com você" : "criado"}
            </h3>
            {type !== "PARTICIPATING" && (
              <p className="text-sm text-muted-foreground">
                Transforme seus roteiros em itinerários com dias e horários
              </p>
            )}
          </div>
          <Link to={type === "PARTICIPATING" ? "/convites" : "/roteiros"}>
            <Button className="gap-2">
              <Check className="w-4 h-4" />
              Ver Meus {type === "PARTICIPATING" ? "Convites" : "Roteiros"}
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
};

export default Itineraries;
