import { useState, useRef } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import { useCreatePost, uploadFile } from "@/services/api/postsService";

interface CreatePostDialogProps {
  children: React.ReactNode; 
  currentUserId: number;
}

export function CreatePostDialog({ children, currentUserId }: CreatePostDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutateAsync: createPostMutate, isPending: isPosting } = useCreatePost();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { 
        toast({
          title: "Arquivo muito grande",
          description: "A imagem deve ter no máximo 5MB.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !selectedFile) {
        toast({
            title: "Campos vazios",
            description: "Escreva algo ou adicione uma imagem para postar.",
            variant: "destructive"
        });
        return;
    }

    try {
      let mediaUrl = undefined;

      if (selectedFile) {
        setIsUploading(true);
        mediaUrl = await uploadFile(selectedFile);
        setIsUploading(false);
      }

      await createPostMutate({
        userId: currentUserId,
        content: content,
        mediaUrl: mediaUrl,
      });

      toast({ title: "Post criado com sucesso!" });
      
      setContent("");
      clearSelectedFile();
      setOpen(false);

    } catch (error) {
      setIsUploading(false);
      toast({
        title: "Erro ao criar postagem",
        description: "Não foi possível concluir sua publicação. Tente novamente.",
        variant: "destructive",
      });
      console.error(error);
    }
  };

  const isLoading = isUploading || isPosting;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Criar nova postagem</DialogTitle>
          <DialogDescription>
            Compartilhe suas experiências com a comunidade.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="post-content" className="sr-only">
              Conteúdo da postagem
            </Label>
            <Textarea
              id="post-content"
              placeholder="No que você está pensando?"
              className="resize-none min-h-[120px] text-base"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {imagePreview && (
            <div className="relative rounded-md overflow-hidden border border-border max-h-[300px] flex justify-center bg-muted/30">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="object-contain max-h-full w-auto"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-80 hover:opacity-100 transition-opacity"
                onClick={clearSelectedFile}
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {!imagePreview && (
            <div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileSelect}
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 text-muted-foreground border-dashed h-24 hover:text-foreground hover:border-solid transition-all"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <ImagePlus className="h-6 w-6" />
                <span>Adicionar uma foto</span>
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            type="submit" 
            onClick={handleSubmit} 
            disabled={isLoading || (!content.trim() && !selectedFile)}
            className="gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isUploading ? "Enviando imagem..." : isPosting ? "Publicando..." : "Publicar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}