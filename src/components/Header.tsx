
import React from "react";
import { BookOpen, Menu, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NavigationMenu } from "./NavigationMenu";
import { useTheme } from "@/context/ThemeContext";

export function Header() {
  const isMobile = useIsMobile();
  const { theme, toggleTheme } = useTheme();
  
  return (
    <header className="bg-legal-navy dark:bg-legal-darkNav text-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-legal-gold" />
            <h1 className="text-xl font-serif tracking-tight">
              Vade Mecum Pro<span className="text-legal-gold">.</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:text-legal-gold"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            
            {isMobile ? (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-64 bg-legal-navy dark:bg-legal-darkNav border-legal-navy dark:border-legal-darkNav">
                  <NavigationMenu vertical />
                </SheetContent>
              </Sheet>
            ) : (
              <NavigationMenu />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
