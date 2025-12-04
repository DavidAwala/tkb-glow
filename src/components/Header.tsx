import { useState } from "react";
import { ShoppingCart, LogOut, Package, Menu, X } from "lucide-react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils"; // Assuming you have a cn utility, if not, standard string concat works

interface HeaderProps {
  cartItemCount: number;
  onCartClick: () => void;
  isAdmin?: boolean;
}

export const Header = ({ cartItemCount, onCartClick, isAdmin }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Shop", path: "/" },
    { label: "About Us", path: "/about" },
    { label: "Contact", path: "/contact" },
    { label: "FAQ", path: "/faq" },
  ];

  // Helper to check active state for styling
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 bg-[#FAFAF8]/95 backdrop-blur-md border-b border-[#556B2F]/10 z-50 transition-all duration-300">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        
        {/* 1. LEFT: LOGO */}
        <div className="flex-shrink-0">
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
            <img 
              src="/logo.png" 
              alt="TKB" 
              className="h-10 w-auto object-contain hover:opacity-80 transition-opacity" 
            />
          </Link>
        </div>

        {/* 2. MIDDLE: DESKTOP NAVIGATION (Hidden on Mobile) */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "text-sm font-medium transition-colors hover:text-[#D4AF37]",
                isActive(link.path) 
                  ? "text-[#556B2F] font-semibold" 
                  : "text-gray-600"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* 3. RIGHT: ICONS (Visible on Mobile & Desktop) */}
        <div className="flex items-center gap-1 md:gap-2">
          
          {/* Admin Button */}
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin')}
              className="hidden sm:flex text-[#556B2F] hover:text-[#D4AF37]"
            >
              Admin
            </Button>
          )}

          {/* User Actions */}
          {user && (
            <>
              <Button
                variant="ghost"
                size="icon"
                title="My orders"
                onClick={() => navigate('/account/orders')}
                className="text-[#556B2F] hover:text-[#D4AF37] hover:bg-[#556B2F]/5"
              >
                <Package className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                title="Sign out"
                className="text-[#556B2F] hover:text-red-500 hover:bg-red-50"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          )}

          {/* Cart Button */}
          <Button
            variant="ghost"
            size="icon"
            className="relative text-[#556B2F] hover:text-[#D4AF37] hover:bg-[#556B2F]/5"
            onClick={onCartClick}
          >
            <ShoppingCart className="h-5 w-5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-in zoom-in">
                {cartItemCount}
              </span>
            )}
          </Button>

          {/* Mobile Menu Toggle (Visible only on Mobile) */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-[#556B2F]"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* 4. MOBILE MENU DROPDOWN */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-[#FAFAF8] border-b border-[#556B2F]/10 shadow-lg animate-in slide-in-from-top-5">
          <nav className="flex flex-col p-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "px-4 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-[#556B2F]/5",
                  isActive(link.path)
                    ? "text-[#556B2F] bg-[#556B2F]/10 font-semibold"
                    : "text-gray-600"
                )}
              >
                {link.label}
              </Link>
            ))}
            {/* Show Admin link in mobile menu if admin (since it might be hidden in icon bar on very small screens) */}
            {isAdmin && (
              <Button
                variant="ghost"
                className="justify-start text-[#556B2F] px-4 py-3"
                onClick={() => {
                  navigate('/admin');
                  setIsMobileMenuOpen(false);
                }}
              >
                Admin Dashboard
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};