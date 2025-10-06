import { Menu, Bell, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  onMenuClick: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Mock notifications - you can replace with real data
  const notifications = [
    { id: 1, message: "Nova imagem gerada com sucesso", time: "5 min atrás" },
    { id: 2, message: "Lote de 3 prompts concluído", time: "1 hora atrás" },
    { id: 3, message: "API key validada", time: "2 horas atrás" },
  ];

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="lg:hidden"
      >
        <Menu className="h-6 w-6" />
      </Button>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        {/* Notifications Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge 
                variant="destructive" 
                className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {notifications.length}
              </Badge>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 bg-card z-50" align="end">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Notificações</h4>
                <Badge variant="secondary">{notifications.length}</Badge>
              </div>
              <div className="space-y-2">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className="p-3 rounded-lg bg-muted hover:bg-muted/80 cursor-pointer transition-colors"
                  >
                    <p className="text-sm">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* User Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarFallback className="bg-gradient-primary text-white text-sm">
                  {user?.email?.[0].toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-card z-50" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Minha Conta</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Meu Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
