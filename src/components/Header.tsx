
import React from "react";
import { BookOpen, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NavigationMenu } from "./NavigationMenu";

export function Header() {
  const isMobile = useIsMobile();
  
  return (
    <header className="bg-legal-navy text-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-legal-gold" />
            <h1 className="text-xl font-serif tracking-tight">
              Vade Mecum Pro<span className="text-legal-gold">.</span>
            </h1>
          </div>
          
          {isMobile ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-64 bg-legal-navy border-legal-navy">
                <NavigationMenu vertical />
              </SheetContent>
            </Sheet>
          ) : (
            <NavigationMenu />
          )}
        </div>
      </div>
    </header>
  );
}
