import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get latest mood check-in
    const { data: latestMood } = await supabaseClient
      .from('mood_checkins')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get pending tasks
    const { data: tasks, error: tasksError } = await supabaseClient
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (tasksError) throw tasksError;

    // Smart scheduling algorithm
    const scheduledTasks = smartSchedule(tasks || [], latestMood);

    // Update scheduled times
    for (const task of scheduledTasks) {
      await supabaseClient
        .from('tasks')
        .update({ scheduled_time: task.scheduled_time })
        .eq('id', task.id);
    }

    console.log(`Scheduled ${scheduledTasks.length} tasks for user ${user.id}`);

    return new Response(
      JSON.stringify({ success: true, scheduledTasks }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scheduling tasks:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function smartSchedule(tasks: any[], mood: any) {
  const now = new Date();
  const currentHour = now.getHours();
  
  // Determine time of day energy level
  const timeOfDayEnergy = currentHour < 12 ? 'high' : currentHour < 17 ? 'medium' : 'low';
  
  // Use mood energy if available, otherwise use time of day
  const energyLevel = mood?.energy_level || timeOfDayEnergy;
  const moodScale = mood?.mood_scale || 7;
  
  // Sort tasks based on mood and energy
  const sortedTasks = [...tasks].sort((a, b) => {
    // Priority weight
    const priorityWeight: { [key: string]: number } = { urgent: 4, high: 3, medium: 2, low: 1 };
    const priorityDiff = (priorityWeight[b.priority] || 1) - (priorityWeight[a.priority] || 1);
    
    // Cognitive load matching with energy
    const loadWeight: { [key: string]: number } = { heavy: 3, moderate: 2, light: 1 };
    const energyMatchA = matchCognitiveLoad(a.cognitive_load, energyLevel);
    const energyMatchB = matchCognitiveLoad(b.cognitive_load, energyLevel);
    
    // Low mood = prioritize easier tasks
    if (moodScale < 5) {
      return (loadWeight[a.cognitive_load] || 1) - (loadWeight[b.cognitive_load] || 1);
    }
    
    // High energy = tackle heavy tasks first
    if (energyLevel === 'high') {
      return (loadWeight[b.cognitive_load] || 1) - (loadWeight[a.cognitive_load] || 1) + priorityDiff;
    }
    
    // Balance energy match and priority
    return (energyMatchB - energyMatchA) * 2 + priorityDiff;
  });
  
  // Schedule tasks with appropriate spacing
  let currentTime = new Date(now);
  currentTime.setMinutes(Math.ceil(currentTime.getMinutes() / 15) * 15); // Round to next 15min
  
  return sortedTasks.map(task => {
    const scheduledTime = new Date(currentTime);
    currentTime = new Date(currentTime.getTime() + task.duration_minutes * 60000 + 15 * 60000); // Add task duration + 15min break
    
    return {
      ...task,
      scheduled_time: scheduledTime.toISOString(),
    };
  });
}

function matchCognitiveLoad(load: string, energy: string): number {
  const matches = {
    'high-heavy': 3,
    'high-moderate': 2,
    'high-light': 1,
    'medium-moderate': 3,
    'medium-light': 2,
    'medium-heavy': 1,
    'low-light': 3,
    'low-moderate': 2,
    'low-heavy': 1,
  };
  return matches[`${energy}-${load}` as keyof typeof matches] || 1;
}