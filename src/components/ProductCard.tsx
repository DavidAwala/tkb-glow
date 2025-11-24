import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  onAddToCart: () => void;
  onViewDetails: () => void;
}

export const ProductCard = ({
  name,
  price,
  image,
  onAddToCart,
  onViewDetails,
}: ProductCardProps) => {
  return (
    <Card className="group overflow-hidden border-border/40 hover:border-border transition-all duration-300 hover:shadow-lg">
      <div 
        className="relative aspect-square overflow-hidden bg-muted cursor-pointer"
        onClick={onViewDetails}
      >
        <img
          src={image}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="p-3 space-y-2">
        <h3 className="font-medium text-sm text-foreground line-clamp-1">{name}</h3>
        <div className="flex items-center justify-between gap-2">
          <span className="text-base font-semibold text-primary">₦{price.toLocaleString()}</span>
          <Button
            size="sm"
            onClick={onAddToCart}
            className="bg-accent hover:bg-accent/90 text-accent-foreground h-8 gap-1"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span className="text-xs font-semibold">Add</span>
          </Button>
        </div>
        <button
          onClick={onViewDetails}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Details →
        </button>
      </div>
    </Card>
  );
};
