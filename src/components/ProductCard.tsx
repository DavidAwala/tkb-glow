import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  benefit: string;
  onAddToCart: () => void;
}

export const ProductCard = ({
  id,
  name,
  price,
  image,
  benefit,
  onAddToCart,
}: ProductCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="group overflow-hidden border-border hover:shadow-lg transition-shadow cursor-pointer">
      <div 
        className="aspect-square overflow-hidden bg-muted"
        onClick={() => navigate(`/product/${id}`)}
      >
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
      </div>
      <div className="p-4 space-y-3">
        <div onClick={() => navigate(`/product/${id}`)}>
          <h3 className="font-medium text-sm mb-1 text-foreground">{name}</h3>
          <p className="text-xs text-muted-foreground">{benefit}</p>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-primary">₦{price.toLocaleString()}</span>
          <Button
            size="sm"
            className="bg-gold hover:bg-gold/90 text-accent-foreground h-8"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart();
            }}
          >
            Add to cart
          </Button>
        </div>
      </div>
    </Card>
  );
};