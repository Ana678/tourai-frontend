import { MapPin, Clock, Star, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ItineraryCardProps {
  title: string;
  location: string;
  duration: string;
  rating: number;
  image: string;
  tags: string[];
  isLiked?: boolean;
}

const ItineraryCard = ({ 
  title, 
  location, 
  duration, 
  rating, 
  image, 
  tags,
  isLiked = false 
}: ItineraryCardProps) => {
  return (
    <Card className="overflow-hidden shadow-soft hover:shadow-medium transition-smooth">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 right-3">
          <Button
            size="icon"
            variant="secondary"
            className="rounded-full w-9 h-9 bg-card/90 backdrop-blur-sm"
          >
            <Heart className={`w-5 h-5 ${isLiked ? "fill-destructive text-destructive" : ""}`} />
          </Button>
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg line-clamp-1 text-foreground">{title}</h3>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{duration}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-accent text-accent" />
          <span className="font-medium text-sm">{rating.toFixed(1)}</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default ItineraryCard;
