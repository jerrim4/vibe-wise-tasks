import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MoodCheckIn } from "./MoodCheckIn";
import { TaskInput } from "./TaskInput";
import { TaskList } from "./TaskList";
import { AffirmationCard } from "./AffirmationCard";
import { LogOut, Sparkles, Moon, Sun, Shield } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useNavigate } from "react-router-dom";

export const Dashboard = () => {
  const [showMoodCheckIn, setShowMoodCheckIn] = useState(false);
  const [taskRefresh, setTaskRefresh] = useState(0);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const { theme, setTheme } = useTheme();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    checkTodaysMoodCheckIn();
  }, []);

  const checkTodaysMoodCheckIn = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from('mood_checkins')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString())
      .limit(1);

    setHasCheckedIn((data && data.length > 0) || false);
    if (!data || data.length === 0) {
      setShowMoodCheckIn(true);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
  };

  const handleMoodCheckInComplete = () => {
    setShowMoodCheckIn(false);
    setHasCheckedIn(true);
    toast.success("Great! Now let's plan your day.");
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--gradient-calm)' }}>
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            SereniDay
          </h1>
          <div className="flex items-center gap-4">
            {hasCheckedIn && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMoodCheckIn(true)}
              >
                Update Mood
              </Button>
            )}
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/admin")}
                className="gap-2"
              >
                <Shield className="w-4 h-4" />
                Admin
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {showMoodCheckIn ? (
          <div className="max-w-2xl mx-auto">
            <MoodCheckIn onComplete={handleMoodCheckInComplete} />
          </div>
        ) : (
          <div className="space-y-6">
            <AffirmationCard />
            
            <div className="grid md:grid-cols-2 gap-6">
              <TaskInput onTaskAdded={() => setTaskRefresh(prev => prev + 1)} />
              <TaskList refreshTrigger={taskRefresh} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};