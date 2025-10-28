import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const AffirmationCard = () => {
  const [affirmation, setAffirmation] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchAffirmation = async (useAI = false) => {
    setLoading(true);
    
    if (useAI) {
      // Get latest mood and use AI to generate personalized affirmation
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in first");
        setLoading(false);
        return;
      }

      const { data: mood } = await supabase
        .from('mood_checkins')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in first");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('generate-affirmation', {
        body: { mood, taskType: 'general' },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        toast.error("Failed to generate affirmation");
        console.error(error);
      } else if (data?.affirmation) {
        setAffirmation(data.affirmation);
      }
    } else {
      // Get random affirmation from database
      const { data, error } = await supabase
        .from('affirmations')
        .select('message')
        .limit(10);

      if (error) {
        toast.error("Failed to fetch affirmation");
      } else if (data && data.length > 0) {
        const random = data[Math.floor(Math.random() * data.length)];
        setAffirmation(random.message);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAffirmation();
  }, []);

  return (
    <Card className="shadow-[var(--shadow-glow)] border-primary/20 overflow-hidden">
      <div className="absolute inset-0 opacity-10" style={{ background: 'var(--gradient-glow)' }} />
      <CardContent className="relative pt-6 pb-4 text-center space-y-4">
        <Heart className="w-8 h-8 mx-auto text-accent animate-pulse" />
        <p className="text-lg font-medium text-foreground leading-relaxed min-h-[3rem] flex items-center justify-center">
          {loading ? "Generating inspiration..." : affirmation}
        </p>
        <div className="flex gap-2 justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchAffirmation(false)}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            New Quote
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAffirmation(true)}
            disabled={loading}
          >
            ✨ AI Personalized
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};