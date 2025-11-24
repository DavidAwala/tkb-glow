import { ShoppingCart, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface HeaderProps {
  cartItemCount?: number;
  onCartClick: () => void;
}

export const Header = ({ cartItemCount = 0, onCartClick }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4">
        {/* Logo */}
        <a href="/" className="flex items-center space-x-2">
          <span className="text-xl font-semibold text-primary tracking-tight">TKB</span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <a href="/" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
            Shop
          </a>
          <a href="#about" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
            About
          </a>
          <a href="#contact" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
            Contact
          </a>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={onCartClick}
          >
            <ShoppingCart className="h-5 w-5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center font-semibold">
                {cartItemCount}
              </span>
            )}
          </Button>

          {/* Mobile Menu */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              <nav className="flex flex-col gap-4 mt-8">
                <a
                  href="/"
                  className="text-lg font-medium text-foreground hover:text-primary transition-colors py-3 border-b border-border"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Shop
                </a>
                <a
                  href="#about"
                  className="text-lg font-medium text-foreground hover:text-primary transition-colors py-3 border-b border-border"
                  onClick={() => setIsMenuOpen(false)}
                >
                  About
                </a>
                <a
                  href="#contact"
                  className="text-lg font-medium text-foreground hover:text-primary transition-colors py-3 border-b border-border"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Contact
                </a>
                <a
                  href="#faq"
                  className="text-lg font-medium text-foreground hover:text-primary transition-colors py-3 border-b border-border"
                  onClick={() => setIsMenuOpen(false)}
                >
                  FAQ
                </a>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
