import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

const EMOTIONS = [
  "energized", "focused", "calm", "motivated", "creative",
  "stressed", "tired", "anxious", "overwhelmed", "peaceful"
];

const ENERGY_LEVELS = [
  { value: "low", label: "Low", color: "bg-blue-500" },
  { value: "medium", label: "Medium", color: "bg-amber-500" },
  { value: "high", label: "High", color: "bg-green-500" }
];

export const MoodCheckIn = ({ onComplete }: { onComplete: () => void }) => {
  const [moodScale, setMoodScale] = useState([7]);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [energyLevel, setEnergyLevel] = useState("medium");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleEmotion = (emotion: string) => {
    setSelectedEmotions(prev =>
      prev.includes(emotion)
        ? prev.filter(e => e !== emotion)
        : [...prev, emotion]
    );
  };

  const handleSubmit = async () => {
    if (selectedEmotions.length === 0) {
      toast.error("Please select at least one emotion");
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Please sign in first");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('mood_checkins').insert({
      user_id: user.id,
      mood_scale: moodScale[0],
      emotion_keywords: selectedEmotions,
      energy_level: energyLevel,
      notes: notes || null
    });

    if (error) {
      toast.error("Failed to save mood check-in");
      console.error(error);
    } else {
      toast.success("Mood check-in saved!");
      onComplete();
    }
    setLoading(false);
  };

  return (
    <Card className="shadow-[var(--shadow-card)] border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <CardTitle>Morning Check-In</CardTitle>
        </div>
        <CardDescription>
          How are you feeling today? This helps me schedule your tasks perfectly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Overall Mood (1-10)</Label>
          <div className="flex items-center gap-4">
            <Slider
              value={moodScale}
              onValueChange={setMoodScale}
              min={1}
              max={10}
              step={1}
              className="flex-1"
            />
            <span className="text-2xl font-bold text-primary min-w-[3ch]">
              {moodScale[0]}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <Label>How would you describe your mood?</Label>
          <div className="flex flex-wrap gap-2">
            {EMOTIONS.map(emotion => (
              <Badge
                key={emotion}
                variant={selectedEmotions.includes(emotion) ? "default" : "outline"}
                className="cursor-pointer transition-all hover:scale-105"
                onClick={() => toggleEmotion(emotion)}
              >
                {emotion}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Energy Level</Label>
          <div className="grid grid-cols-3 gap-2">
            {ENERGY_LEVELS.map(level => (
              <Button
                key={level.value}
                variant={energyLevel === level.value ? "default" : "outline"}
                onClick={() => setEnergyLevel(level.value)}
                className="h-12"
              >
                <div className={`w-3 h-3 rounded-full ${level.color} mr-2`} />
                {level.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            placeholder="Anything else on your mind?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full"
        >
          {loading ? "Saving..." : "Complete Check-In"}
        </Button>
      </CardContent>
    </Card>
  );
};