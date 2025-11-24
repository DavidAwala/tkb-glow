import { ShoppingCart, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/useAuth";

interface HeaderProps {
  cartItemCount: number;
  onCartClick: () => void;
  isAdmin?: boolean;
}

export const Header = ({ cartItemCount, onCartClick, isAdmin }: HeaderProps) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-b border-border z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="text-xl font-semibold text-olive">
          TKB
        </button>
        
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin')}
            >
              Admin
            </Button>
          )}
          {user && (
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              title="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={onCartClick}
          >
            <ShoppingCart className="h-5 w-5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-gold text-accent-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
};