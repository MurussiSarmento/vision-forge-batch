import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Create profile and assign default role if user signs up
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(async () => {
            // Upsert profile
            const { error: profileError } = await supabase
              .from('profiles')
              .upsert({
                id: session.user.id,
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name || null,
              }, { onConflict: 'id' });
            
            if (profileError) console.error('Error creating profile:', profileError);

            // Check if user already has a role
            const { data: existingRole, error: roleCheckError } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', session.user.id)
              .single();

            // If no role exists, assign default 'user' role
            if (!existingRole && !roleCheckError) {
              const { error: roleError } = await supabase
                .from('user_roles')
                .insert({
                  user_id: session.user.id,
                  role: 'user',
                });

              if (roleError) console.error('Error assigning role:', roleError);
            }

            // Check account status
            const { data: profile } = await supabase
              .from('profiles')
              .select('status')
              .eq('id', session.user.id)
              .single();

            if (profile?.status === 'suspended') {
              await supabase.auth.signOut();
              toast({
                title: "Conta suspensa",
                description: "Sua conta foi suspensa. Entre em contato com o administrador.",
                variant: "destructive",
              });
              navigate("/auth");
            } else if (profile?.status === 'pending') {
              await supabase.auth.signOut();
              toast({
                title: "Aguardando aprovação",
                description: "Sua conta está aguardando aprovação do administrador.",
              });
              navigate("/auth?pending=true");
            }
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};