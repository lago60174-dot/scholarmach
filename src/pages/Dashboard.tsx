import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { Session } from "@supabase/supabase-js";

export default function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        if (!currentSession) {
          navigate("/auth");
        } else if (currentSession.user) {
          // Fetch profile when session is valid
          setTimeout(() => {
            supabase
              .from("profiles")
              .select("*")
              .eq("id", currentSession.user.id)
              .single()
              .then(({ data }) => setProfile(data));
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (!currentSession) {
        navigate("/auth");
      } else {
        supabase
          .from("profiles")
          .select("*")
          .eq("id", currentSession.user.id)
          .single()
          .then(({ data }) => setProfile(data));
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
          <Card>
            <CardHeader>
              <CardTitle>Welcome, {profile?.full_name || "Student"}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Your dashboard is ready</p>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}