import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Images, CheckCircle2, Loader2, AlertCircle, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

const History = () => {
  const { user } = useAuth();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["generation-sessions-history", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("generation_sessions")
        .select(`
          *,
          prompt_batches (
            id,
            variations_count
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle2, color: 'text-success bg-success/10', label: 'Completo' };
      case 'processing':
        return { icon: Loader2, color: 'text-primary bg-primary/10', label: 'Processando' };
      case 'failed':
        return { icon: XCircle, color: 'text-destructive bg-destructive/10', label: 'Falhou' };
      default:
        return { icon: AlertCircle, color: 'text-muted-foreground bg-muted', label: 'Pendente' };
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Histórico de Gerações</h1>
        <p className="mt-2 text-muted-foreground">
          Visualize suas sessões anteriores de geração de imagens
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !sessions || sessions.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Images className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma sessão ainda</h3>
            <p className="text-muted-foreground mb-4">
              Você ainda não criou nenhuma sessão de geração de imagens
            </p>
            <Link to="/prompt-batch">
              <Button>Criar Primeiro Batch</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const StatusIcon = getStatusInfo(session.status).icon;
            const totalImages = session.prompt_batches?.reduce(
              (sum: number, batch: any) => sum + (batch.variations_count || 0),
              0
            ) || 0;
            return (
              <Card key={session.id} className="p-6 transition-all hover:shadow-lg hover:shadow-primary/10">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
                      <Images className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          Sessão {format(new Date(session.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </h3>
                        <span className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${getStatusInfo(session.status).color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {getStatusInfo(session.status).label}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDistanceToNow(new Date(session.created_at), { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Prompts</p>
                      <p className="text-2xl font-bold text-foreground">{session.total_prompts || 0}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Imagens</p>
                      <p className="text-2xl font-bold text-primary">{totalImages}</p>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/results?session=${session.id}`}>
                        <Button variant="outline">Ver Resultados</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default History;
