import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";

const TASK_TYPES = [
  { value: "work", label: "Work" },
  { value: "personal", label: "Personal" },
  { value: "health", label: "Health" },
  { value: "learning", label: "Learning" },
  { value: "creative", label: "Creative" }
];

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" }
];

const COGNITIVE_LOADS = [
  { value: "light", label: "Light", description: "Simple, routine tasks" },
  { value: "moderate", label: "Moderate", description: "Regular focus needed" },
  { value: "heavy", label: "Heavy", description: "Deep concentration required" }
];

export const TaskInput = ({ onTaskAdded }: { onTaskAdded: () => void }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taskType, setTaskType] = useState("work");
  const [priority, setPriority] = useState("medium");
  const [duration, setDuration] = useState("30");
  const [cognitiveLoad, setCognitiveLoad] = useState("moderate");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted');
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in first");
      setLoading(false);
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a task title");
      setLoading(false);
      return;
    }

    console.log('Inserting task:', { title, taskType, priority, duration, cognitiveLoad });

    const { error } = await supabase.from('tasks').insert({
      user_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      task_type: taskType,
      priority,
      duration_minutes: parseInt(duration),
      cognitive_load: cognitiveLoad,
      deadline: deadline ? new Date(deadline).toISOString() : null,
    });

    if (error) {
      toast.error("Failed to add task: " + error.message);
      console.error('Insert error:', error);
    } else {
      toast.success("Task added!");
      console.log('Task added successfully');
      // Reset form
      setTitle("");
      setDescription("");
      setDuration("30");
      setDeadline("");
      onTaskAdded();
    }
    setLoading(false);
  };

  return (
    <Card className="shadow-[var(--shadow-card)] border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-primary" />
          <CardTitle>Add New Task</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Task Type</Label>
              <Select value={taskType} onValueChange={setTaskType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map(p => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="5"
                step="5"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cognitive Load</Label>
            <Select value={cognitiveLoad} onValueChange={setCognitiveLoad}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COGNITIVE_LOADS.map(load => (
                  <SelectItem key={load.value} value={load.value}>
                    <div>
                      <div className="font-medium">{load.label}</div>
                      <div className="text-xs text-muted-foreground">{load.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Adding..." : "Add Task"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};