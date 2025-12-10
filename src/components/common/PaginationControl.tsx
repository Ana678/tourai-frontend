import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface PaginationControlProps {
  currentPage: number; // 0-based index (padrão Spring)
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PaginationControl({ currentPage, totalPages, onPageChange }: PaginationControlProps) {
  // Converte 0-based (Spring) para 1-based (Visual)
  const pageNumber = currentPage + 1;

  // Se houver apenas 1 página ou nenhuma, não mostra a paginação
  if (totalPages <= 1) return null;

  return (
    <Pagination className="mt-8">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious 
            onClick={() => currentPage > 0 && onPageChange(currentPage - 1)} 
            className={currentPage === 0 ? "pointer-events-none opacity-50" : "cursor-pointer"}
          />
        </PaginationItem>
        
        {/* Exibe indicador de página atual */}
        <PaginationItem>
           <span className="px-4 text-sm font-medium text-muted-foreground">
             Página {pageNumber} de {totalPages}
           </span>
        </PaginationItem>

        <PaginationItem>
          <PaginationNext 
            onClick={() => currentPage < totalPages - 1 && onPageChange(currentPage + 1)}
            className={currentPage >= totalPages - 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}