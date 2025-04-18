
import React from "react";
import { BookOpen, Star, Settings, Info, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavigationMenuProps {
  vertical?: boolean;
}

export function NavigationMenu({ vertical = false }: NavigationMenuProps) {
  const menuItems = [
    { label: "Artigos", icon: <BookOpen className="h-4 w-4" /> },
    { label: "Favoritos", icon: <Star className="h-4 w-4" /> },
    { label: "Exportar", icon: <Download className="h-4 w-4" /> },
    { label: "Sobre", icon: <Info className="h-4 w-4" /> },
    { label: "Configurações", icon: <Settings className="h-4 w-4" /> }
  ];
  
  if (vertical) {
    return (
      <div className="pt-6 flex flex-col gap-2">
        <div className="mb-4">
          <h2 className="flex items-center gap-2 text-lg font-medium text-white">
            <BookOpen className="h-5 w-5 text-legal-gold" /> 
            Vade Mecum Pro
          </h2>
        </div>
        
        <nav className="flex flex-col gap-1">
          {menuItems.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              className="justify-start text-white hover:text-legal-gold hover:bg-white/10"
            >
              {item.icon}
              <span className="ml-2">{item.label}</span>
            </Button>
          ))}
        </nav>
      </div>
    );
  }
  
  return (
    <nav className="hidden md:flex items-center gap-4">
      {menuItems.map((item) => (
        <Button
          key={item.label}
          variant="ghost"
          size="sm"
          className="text-white hover:text-legal-gold hover:bg-white/10"
        >
          {item.icon}
          <span className="ml-2">{item.label}</span>
        </Button>
      ))}
    </nav>
  );
}
