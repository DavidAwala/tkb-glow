import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { motion } from "framer-motion";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  benefit: string;     // short_desc
  stock: number;
  onAddToCart: () => void;
}

export const ProductCard = ({
  id,
  name,
  price,
  originalPrice,
  image,
  benefit,
  stock,
  onAddToCart,
}: ProductCardProps) => {
  const navigate = useNavigate();

  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock < 5;

  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
    >
      <Card className="group overflow-hidden border-border hover:shadow-lg transition-shadow cursor-pointer">

        {/* IMAGE SECTION */}
        <div 
          className="relative aspect-square overflow-hidden bg-muted"
          onClick={() => navigate(`/product/${id}`)}
        >
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />

          {/* LOW STOCK BADGE */}
          {isLowStock && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] px-2 py-1 rounded-full">
              Low Stock
            </span>
          )}

          {/* OUT OF STOCK BADGE */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-xs font-semibold bg-black/60 px-3 py-1 rounded">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* PRODUCT DETAILS */}
        <div className="p-4 space-y-3">

          {/* NAME + BENEFIT */}
          <div onClick={() => navigate(`/product/${id}`)}>
            <h3 className="font-medium text-sm mb-1 text-foreground truncate">
              {name}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {benefit}
            </p>
          </div>

          {/* PRICING */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-primary">
              ₦{price.toLocaleString()}
            </span>

            {originalPrice && originalPrice > price && (
              <span className="text-xs text-gray-400 line-through">
                ₦{originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          {/* Click for more details */}
          <p
            className="text-[10px] text-gray-500 underline cursor-pointer"
            onClick={() => navigate(`/product/${id}`)}
          >
            Click for more details
          </p>

          {/* ADD TO CART BUTTON */}
          <Button
            size="sm"
            disabled={isOutOfStock}
            className={`h-8 w-full ${
              isOutOfStock
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-gold hover:bg-gold/90 text-accent-foreground"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              if (!isOutOfStock) onAddToCart();
            }}
          >
            {isOutOfStock ? "Out of Stock" : "Add to Cart"}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};
