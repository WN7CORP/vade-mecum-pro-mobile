
import React from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Search, BookOpen, Home } from "lucide-react";

export function Header() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <header className="sticky top-0 z-50 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          <Link 
            to="/" 
            className="flex items-center gap-1.5 text-lg font-bold"
          >
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              WADMECON
              <span className="font-normal">2025</span>
            </span>
            <span className="text-xs rounded bg-accent text-white px-1.5 py-0.5">PRO</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-1">
            <Button asChild variant="ghost" size="sm">
              <Link to="/" className="flex items-center gap-1.5">
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/browse" className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                <span>Explorar</span>
              </Link>
            </Button>
          </nav>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Alternar tema"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? (
              <Sun className="h-[1.2rem] w-[1.2rem] text-accent" />
            ) : (
              <Moon className="h-[1.2rem] w-[1.2rem]" />
            )}
          </Button>
          
          <div className="block md:hidden">
            <Button asChild variant="ghost" size="icon">
              <Link to="/browse">
                <BookOpen className="h-[1.2rem] w-[1.2rem]" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
