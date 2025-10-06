import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Edit, UserX, UserCheck } from "lucide-react";
import { Navigate } from "react-router-dom";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  status: string;
  created_at: string;
}

const AdminUsers = () => {
  const { user } = useAuth();
  const { data: userRole, isLoading: isLoadingRole } = useUserRole(user?.id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Profile[];
    },
    enabled: userRole === "admin",
  });

  const updateProfileMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: Partial<Profile> }) => {
      const { error } = await supabase
        .from("profiles")
        .update(data)
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      toast({
        title: "Usuário atualizado",
        description: "As informações do usuário foram atualizadas com sucesso.",
      });
      setIsDialogOpen(false);
      setEditingUser(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ userId, newStatus }: { userId: string; newStatus: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ status: newStatus })
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      toast({
        title: "Status atualizado",
        description: "O status da conta foi atualizado.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (profile: Profile) => {
    setEditingUser(profile);
    setEditFullName(profile.full_name || "");
    setEditAvatarUrl(profile.avatar_url || "");
    setIsDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingUser) return;

    updateProfileMutation.mutate({
      userId: editingUser.id,
      data: {
        full_name: editFullName,
        avatar_url: editAvatarUrl,
      },
    });
  };

  const handleToggleStatus = (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    toggleStatusMutation.mutate({ userId, newStatus });
  };

  if (isLoadingRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (userRole !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Usuários</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os usuários do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles?.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">{profile.email}</TableCell>
                    <TableCell>{profile.full_name || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={profile.status === "active" ? "default" : "destructive"}>
                        {profile.status === "active" ? "Ativo" : "Suspenso"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(profile.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Dialog open={isDialogOpen && editingUser?.id === profile.id} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(profile)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Usuário</DialogTitle>
                            <DialogDescription>
                              Atualize as informações do usuário
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-email">Email</Label>
                              <Input
                                id="edit-email"
                                value={editingUser?.email || ""}
                                disabled
                                className="bg-muted"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-fullname">Nome Completo</Label>
                              <Input
                                id="edit-fullname"
                                value={editFullName}
                                onChange={(e) => setEditFullName(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-avatar">URL do Avatar</Label>
                              <Input
                                id="edit-avatar"
                                value={editAvatarUrl}
                                onChange={(e) => setEditAvatarUrl(e.target.value)}
                              />
                            </div>
                            <Button
                              onClick={handleSaveEdit}
                              disabled={updateProfileMutation.isPending}
                              className="w-full"
                            >
                              {updateProfileMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Salvar
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant={profile.status === "active" ? "destructive" : "default"}
                        size="sm"
                        onClick={() => handleToggleStatus(profile.id, profile.status)}
                        disabled={toggleStatusMutation.isPending}
                      >
                        {profile.status === "active" ? (
                          <UserX className="h-4 w-4" />
                        ) : (
                          <UserCheck className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;
