import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, Circle, Clock, Trash2, Sparkles } from "lucide-react";
import { format } from "date-fns";

interface Task {
  id: string;
  title: string;
  description: string | null;
  task_type: string;
  priority: string;
  duration_minutes: number;
  cognitive_load: string;
  status: string;
  scheduled_time: string | null;
  deadline: string | null;
}

const PRIORITY_COLORS = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-green-500"
};

const TYPE_COLORS = {
  work: "bg-blue-500",
  personal: "bg-purple-500",
  health: "bg-green-500",
  learning: "bg-indigo-500",
  creative: "bg-pink-500"
};

export const TaskList = ({ refreshTrigger }: { refreshTrigger: number }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState(false);

  const fetchTasks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['pending', 'in_progress'])
      .order('scheduled_time', { ascending: true, nullsFirst: false });

    if (error) {
      console.error(error);
      toast.error("Failed to fetch tasks");
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, [refreshTrigger]);

  const handleScheduleTasks = async () => {
    setScheduling(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast.error("Please sign in first");
      setScheduling(false);
      return;
    }

    const { error } = await supabase.functions.invoke('schedule-tasks', {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (error) {
      toast.error("Failed to schedule tasks");
      console.error(error);
    } else {
      toast.success("Tasks scheduled based on your mood!");
      fetchTasks();
    }
    setScheduling(false);
  };

  const handleToggleComplete = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    const { error } = await supabase
      .from('tasks')
      .update({
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null
      })
      .eq('id', task.id);

    if (error) {
      toast.error("Failed to update task");
    } else {
      toast.success(newStatus === 'completed' ? "Task completed!" : "Task reopened");
      fetchTasks();
    }
  };

  const handleDelete = async (taskId: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) {
      toast.error("Failed to delete task");
    } else {
      toast.success("Task deleted");
      fetchTasks();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Loading tasks...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-[var(--shadow-card)] border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Your Tasks
          </CardTitle>
          <Button
            onClick={handleScheduleTasks}
            disabled={scheduling || tasks.length === 0}
            size="sm"
            variant="outline"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {scheduling ? "Scheduling..." : "Smart Schedule"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No tasks yet. Add your first task to get started!</p>
          </div>
        ) : (
          tasks.map(task => (
            <div
              key={task.id}
              className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-start gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="mt-0.5"
                  onClick={() => handleToggleComplete(task)}
                >
                  {task.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </Button>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-foreground">{task.title}</h4>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(task.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  
                  {task.description && (
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">
                      <div className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS]} mr-1`} />
                      {task.priority}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <div className={`w-2 h-2 rounded-full ${TYPE_COLORS[task.task_type as keyof typeof TYPE_COLORS]} mr-1`} />
                      {task.task_type}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {task.duration_minutes}min
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {task.cognitive_load} focus
                    </Badge>
                    {task.scheduled_time && (
                      <Badge className="text-xs bg-primary">
                        <Clock className="w-3 h-3 mr-1" />
                        {format(new Date(task.scheduled_time), 'h:mm a')}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};