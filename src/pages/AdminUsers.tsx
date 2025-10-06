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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Edit, UserX, UserCheck, Shield, Activity, UserPlus, Key, Eye, EyeOff } from "lucide-react";
import { Navigate } from "react-router-dom";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  status: string;
  created_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: string;
}

interface ActivityLog {
  id: string;
  admin_user_id: string;
  action: string;
  target_user_id: string;
  details: any;
  created_at: string;
}

interface ApiKey {
  id: string;
  user_id: string;
  key_name: string;
  encrypted_key: string;
  is_valid: boolean;
  usage_count: number;
  created_at: string;
  last_validated_at: string;
}

const AdminUsers = () => {
  const { user } = useAuth();
  const { data: userRole, isLoading: isLoadingRole } = useUserRole(user?.id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [editRole, setEditRole] = useState<"admin" | "user">("user");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Create user states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserFullName, setNewUserFullName] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

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

  const { data: userRoles } = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*");

      if (error) throw error;
      return data as UserRole[];
    },
    enabled: userRole === "admin",
  });

  const { data: activityLogs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ["admin-activity-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_activity_logs")
        .select(`
          *,
          profiles!admin_activity_logs_admin_user_id_fkey(email, full_name)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as ActivityLog[];
    },
    enabled: userRole === "admin",
  });

  const { data: apiKeys, isLoading: isLoadingKeys } = useQuery({
    queryKey: ["admin-api-keys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("api_keys")
        .select(`
          *,
          profiles!api_keys_user_id_fkey(email, full_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as any[];
    },
    enabled: userRole === "admin",
  });

  const logActivity = async (action: string, targetUserId: string, details?: any) => {
    await supabase.from("admin_activity_logs").insert({
      admin_user_id: user?.id,
      action,
      target_user_id: targetUserId,
      details,
    });
  };

  const updateProfileMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: Partial<Profile> }) => {
      const { error } = await supabase
        .from("profiles")
        .update(data)
        .eq("id", userId);

      if (error) throw error;
      await logActivity("UPDATE_PROFILE", userId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-activity-logs"] });
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

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: "admin" | "user" }) => {
      // Delete existing role
      await supabase.from("user_roles").delete().eq("user_id", userId);
      
      // Insert new role
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole });

      if (error) throw error;
      await logActivity("CHANGE_ROLE", userId, { new_role: newRole });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-activity-logs"] });
      toast({
        title: "Role atualizado",
        description: "O role do usuário foi atualizado.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar role",
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
      await logActivity("CHANGE_STATUS", userId, { new_status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-activity-logs"] });
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
    
    const role = userRoles?.find((r) => r.user_id === profile.id);
    setEditRole((role?.role as "admin" | "user") || "user");
    
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

    // Update role if changed
    const currentRole = userRoles?.find((r) => r.user_id === editingUser.id);
    if (currentRole?.role !== editRole) {
      updateRoleMutation.mutate({
        userId: editingUser.id,
        newRole: editRole,
      });
    }
  };

  const handleToggleStatus = (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" 
      ? "suspended" 
      : currentStatus === "pending"
      ? "active"
      : "active";
    toggleStatusMutation.mutate({ userId, newStatus });
  };

  const getUserRole = (userId: string) => {
    return userRoles?.find((r) => r.user_id === userId)?.role || "user";
  };

  const generateTemporaryPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewUserPassword(password);
  };

  const createUserMutation = useMutation({
    mutationFn: async ({ email, password, fullName }: { email: string; password: string; fullName: string }) => {
      const { data, error } = await supabase.functions.invoke("create-users", {
        body: { 
          users: [{
            email,
            password,
            full_name: fullName
          }]
        },
      });

      if (error) throw error;
      if (!data.results[0]?.success) {
        throw new Error(data.results[0]?.error || "Erro ao criar usuário");
      }
      
      await logActivity("CREATE_USER", data.results[0].userId, { email, full_name: fullName });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-activity-logs"] });
      toast({
        title: "Usuário criado",
        description: "O usuário foi criado com sucesso. A senha temporária foi gerada.",
      });
      setIsCreateDialogOpen(false);
      setNewUserEmail("");
      setNewUserFullName("");
      setNewUserPassword("");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateUser = () => {
    if (!newUserEmail || !newUserPassword || !newUserFullName) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }
    createUserMutation.mutate({ 
      email: newUserEmail, 
      password: newUserPassword,
      fullName: newUserFullName
    });
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId);
    } else {
      newVisible.add(keyId);
    }
    setVisibleKeys(newVisible);
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Painel Administrativo</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie usuários e visualize atividades do sistema
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="create">Criar Usuário</TabsTrigger>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="activity">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
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
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles?.map((profile) => {
                      const role = getUserRole(profile.id);
                      return (
                        <TableRow key={profile.id}>
                          <TableCell className="font-medium">{profile.email}</TableCell>
                          <TableCell>{profile.full_name || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={role === "admin" ? "default" : "secondary"}>
                              {role === "admin" ? (
                                <><Shield className="h-3 w-3 mr-1" /> Admin</>
                              ) : (
                                "Usuário"
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                profile.status === "active" 
                                  ? "default" 
                                  : profile.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {profile.status === "active" 
                                ? "Ativo" 
                                : profile.status === "pending"
                                ? "Pendente"
                                : "Suspenso"}
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
                                    Atualize as informações e permissões do usuário
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
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-role">Role</Label>
                                    <Select value={editRole} onValueChange={(value: "admin" | "user") => setEditRole(value)}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="user">Usuário</SelectItem>
                                        <SelectItem value="admin">Administrador</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <Button
                                    onClick={handleSaveEdit}
                                    disabled={updateProfileMutation.isPending || updateRoleMutation.isPending}
                                    className="w-full"
                                  >
                                    {(updateProfileMutation.isPending || updateRoleMutation.isPending) && (
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
                              onClick={() => handleToggleStatus(
                                profile.id, 
                                profile.status
                              )}
                              disabled={toggleStatusMutation.isPending}
                            >
                              {profile.status === "active" ? (
                                <UserX className="h-4 w-4" />
                              ) : profile.status === "pending" ? (
                                <UserCheck className="h-4 w-4" />
                              ) : (
                                <UserCheck className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                <CardTitle>Criar Novo Usuário</CardTitle>
              </div>
              <CardDescription>
                Crie um novo usuário com senha temporária
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-md mx-auto space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-email">Email</Label>
                  <Input
                    id="new-email"
                    type="email"
                    placeholder="usuario@exemplo.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-fullname">Nome Completo</Label>
                  <Input
                    id="new-fullname"
                    placeholder="Nome do usuário"
                    value={newUserFullName}
                    onChange={(e) => setNewUserFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Senha Temporária</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Senha temporária"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateTemporaryPassword}
                    >
                      Gerar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    O usuário deverá alterar esta senha no primeiro acesso
                  </p>
                </div>
                <Button
                  onClick={handleCreateUser}
                  disabled={createUserMutation.isPending}
                  className="w-full"
                >
                  {createUserMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Criar Usuário
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keys">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                <CardTitle>API Keys dos Usuários</CardTitle>
              </div>
              <CardDescription>
                Visualize todas as API keys cadastradas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingKeys ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Nome da Key</TableHead>
                      <TableHead>Chave</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Uso</TableHead>
                      <TableHead>Criada em</TableHead>
                      <TableHead>Última validação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeys?.map((key: any) => (
                      <TableRow key={key.id}>
                        <TableCell className="font-medium">
                          {key.profiles?.email || "Desconhecido"}
                        </TableCell>
                        <TableCell>{key.key_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {visibleKeys.has(key.id) 
                                ? key.encrypted_key 
                                : "••••••••••••••••"}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleKeyVisibility(key.id)}
                            >
                              {visibleKeys.has(key.id) ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={key.is_valid ? "default" : "destructive"}>
                            {key.is_valid ? "Válida" : "Inválida"}
                          </Badge>
                        </TableCell>
                        <TableCell>{key.usage_count || 0} usos</TableCell>
                        <TableCell className="text-xs">
                          {new Date(key.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-xs">
                          {key.last_validated_at 
                            ? new Date(key.last_validated_at).toLocaleDateString("pt-BR")
                            : "Nunca"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {apiKeys?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Nenhuma API key cadastrada
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <CardTitle>Logs de Atividade</CardTitle>
              </div>
              <CardDescription>
                Histórico de ações administrativas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingLogs ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  {activityLogs?.map((log: any) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-4 p-4 rounded-lg border bg-card"
                    >
                      <Activity className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">
                          {log.action.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Administrador: {log.profiles?.email || "Desconhecido"}
                        </p>
                        {log.details && (
                          <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString("pt-BR")}
                      </div>
                    </div>
                  ))}
                  {activityLogs?.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma atividade registrada
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminUsers;
