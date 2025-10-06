import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Key, FileText, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const Dashboard = () => {
  const { user } = useAuth();

  // Fetch generation sessions
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["generation-sessions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("generation_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch API keys
  const { data: apiKeys, isLoading: apiKeysLoading } = useQuery({
    queryKey: ["api-keys", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("api_keys")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_valid", true);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Calculate stats
  const totalGenerations = sessions?.length || 0;
  const activeApiKeys = apiKeys?.length || 0;
  
  const totalPrompts = sessions?.reduce((sum, session) => sum + (session.total_prompts || 0), 0) || 0;
  const completedPrompts = sessions?.reduce((sum, session) => sum + (session.completed_prompts || 0), 0) || 0;
  const successRate = totalPrompts > 0 ? ((completedPrompts / totalPrompts) * 100).toFixed(1) : "0.0";

  const recentSessions = sessions?.slice(0, 5) || [];

  const stats = [
    { 
      label: "Total de Sessões", 
      value: totalGenerations.toString(), 
      change: totalGenerations > 0 ? `${totalGenerations} sessões` : "Nenhuma ainda",
      trend: totalGenerations > 0 ? "up" : "neutral"
    },
    { 
      label: "API Keys Ativas", 
      value: activeApiKeys.toString(), 
      change: activeApiKeys > 0 ? `${activeApiKeys} configuradas` : "Nenhuma",
      trend: activeApiKeys > 0 ? "up" : "neutral"
    },
    { 
      label: "Taxa de Sucesso", 
      value: `${successRate}%`, 
      change: `${completedPrompts}/${totalPrompts} prompts`,
      trend: parseFloat(successRate) >= 90 ? "up" : "neutral"
    },
    { 
      label: "Prompts Totais", 
      value: totalPrompts.toString(), 
      change: completedPrompts > 0 ? `${completedPrompts} completos` : "Aguardando",
      trend: completedPrompts > 0 ? "up" : "neutral"
    },
  ];

  const isLoading = sessionsLoading || apiKeysLoading;

  const quickActions = [
    {
      title: "Setup API Keys",
      description: "Add and validate your Google Vision API keys",
      icon: Key,
      href: "/api-setup",
      color: "from-blue-500 to-indigo-600",
    },
    {
      title: "Create Batch",
      description: "Upload prompts and start generating images",
      icon: FileText,
      href: "/prompt-batch",
      color: "from-purple-500 to-pink-600",
    },
    {
      title: "Quick Generate",
      description: "Generate images with existing configuration",
      icon: Zap,
      href: "/generation",
      color: "from-emerald-500 to-teal-600",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Welcome back! Here's your image generation overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          stats.map((stat, index) => (
            <Card
              key={index}
              className="p-6 transition-all hover:shadow-lg hover:shadow-primary/10"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
                </div>
                <div className="ml-4">
                  {stat.trend === "up" && (
                    <TrendingUp className="h-5 w-5 text-success" />
                  )}
                  {stat.trend === "down" && (
                    <TrendingDown className="h-5 w-5 text-primary" />
                  )}
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{stat.change}</p>
            </Card>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-foreground">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action, index) => (
            <Link key={index} to={action.href}>
              <Card className="group relative overflow-hidden p-6 transition-all hover:shadow-lg hover:shadow-primary/20">
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 transition-opacity group-hover:opacity-10`}
                />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className={`rounded-lg bg-gradient-to-br ${action.color} p-3 shadow-lg`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">
                    {action.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {action.description}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h2 className="mb-4 text-xl font-semibold text-foreground">Atividade Recente</h2>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : recentSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Zap className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Nenhuma atividade ainda</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Comece criando um batch de prompts
            </p>
            <Link to="/prompt-batch">
              <Button className="mt-4" size="sm">
                Criar Batch
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {session.total_prompts} prompts • {session.completed_prompts} completos
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      session.status === 'completed' 
                        ? 'bg-success/10 text-success' 
                        : session.status === 'failed'
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {session.status === 'completed' ? 'Completo' : 
                       session.status === 'failed' ? 'Falhou' :
                       session.status === 'processing' ? 'Processando' : 'Pendente'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(session.created_at), { 
                        addSuffix: true,
                        locale: ptBR 
                      })}
                    </span>
                  </div>
                </div>
                <Link to="/history">
                  <Button variant="ghost" size="sm">
                    Ver
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
