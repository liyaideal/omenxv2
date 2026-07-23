import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Task {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  type: 'onboarding' | 'referral' | 'social' | 'retention';
  trigger_condition: Record<string, unknown>;
  reward_points: number;
  max_completions: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface UserTask {
  id: string;
  user_id: string;
  task_id: string;
  status: 'pending' | 'completed' | 'expired' | 'claimed';
  progress: Record<string, unknown>;
  completed_at: string | null;
  claimed_at: string | null;
  points_awarded: number | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown> | null;
}

export interface TaskWithProgress extends Task {
  userTask?: UserTask;
  canClaim: boolean;
  isCompleted: boolean;
  isClaimed: boolean;
}

export const useTasks = () => {
  const queryClient = useQueryClient();

  // Fetch all active tasks
  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as Task[];
    },
  });

  // Fetch user's task progress
  const { data: userTasks, isLoading: isLoadingUserTasks } = useQuery({
    queryKey: ['user-tasks'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_tasks')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data as UserTask[];
    },
  });

  // Check task completion based on trigger conditions
  const checkTaskCompletion = async (task: Task): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const condition = task.trigger_condition;
    const action = condition.action as string;

    switch (action) {
      case 'register':
        // User is registered if they're logged in
        return true;

      case 'view_event':
        // Check if user has viewed any event (could track via analytics)
        // For now, assume true if they've been to the platform
        return true;

      case 'first_trade':
        // Check trades table
        const { data: trades } = await supabase
          .from('trades')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);
        return (trades?.length || 0) > 0;

      case 'referral_qualified':
        // Check if any referrals are qualified
        const { data: referrals } = await supabase
          .from('referrals')
          .select('id')
          .eq('referrer_id', user.id)
          .eq('status', 'qualified')
          .limit(1);
        return (referrals?.length || 0) > 0;

      case 'share_x':
        return false;

      case 'join_discord':
        return false;

      case 'connect_external': {
        // Check Supabase first
        const { data: accounts } = await supabase
          .from('connected_accounts')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .limit(1);
        if ((accounts?.length || 0) > 0) return true;
        // Check demo localStorage
        try {
          const demoKey = `demo_connected_accounts:${user.id}`;
          const stored = localStorage.getItem(demoKey);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) return true;
          }
        } catch {}
        return false;
      }

      case 'activate_airdrop': {
        // Check Supabase first
        const { data: activated } = await supabase
          .from('airdrop_positions')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'activated')
          .limit(1);
        if ((activated?.length || 0) > 0) return true;
        // Check demo localStorage
        try {
          const demoStored = localStorage.getItem(`omenx-demo-airdrop-positions:${user.id}`);
          if (demoStored) {
            const parsed = JSON.parse(demoStored);
            if (Array.isArray(parsed) && parsed.some((a: any) => a.status === 'activated')) return true;
          }
        } catch {}
        return false;
      }

      default:
        return false;
    }
  };

  // Combine tasks with user progress and sort by status
  const tasksWithProgress: TaskWithProgress[] = (tasks || [])
    .map(task => {
      const userTask = userTasks?.find(ut => ut.task_id === task.id);
      const isCompleted = userTask?.status === 'completed' || userTask?.status === 'claimed';
      const isClaimed = userTask?.status === 'claimed';
      const canClaim = userTask?.status === 'completed' && !isClaimed;

      return {
        ...task,
        userTask,
        canClaim,
        isCompleted,
        isClaimed,
      };
    })
    .sort((a, b) => {
      // Priority: Claimable (1) > Pending (2) > Claimed (3)
      const getPriority = (task: TaskWithProgress) => {
        if (task.isCompleted && !task.isClaimed) return 1; // Claimable
        if (!task.isCompleted && !task.isClaimed) return 2; // Pending
        return 3; // Claimed
      };
      return getPriority(a) - getPriority(b);
    });

  // Claim task reward via secure edge function
  const claimMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/claim-task`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ taskId }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to claim task');
      }

      return result;
    },
    onSuccess: (data) => {
      toast.success(`+${data.pointsEarned} points earned!`, {
        description: data.task.name,
      });
      queryClient.invalidateQueries({ queryKey: ['user-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['points-account'] });
      queryClient.invalidateQueries({ queryKey: ['points-history'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Check and update task completion status
  const refreshTaskStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !tasks) return;

    for (const task of tasks) {
      const userTask = userTasks?.find(ut => ut.task_id === task.id);
      if (userTask?.status === 'claimed') continue;

      const isCompleted = await checkTaskCompletion(task);
      
      if (isCompleted && (!userTask || userTask.status === 'pending')) {
        if (userTask) {
          await supabase
            .from('user_tasks')
            .update({ status: 'completed', completed_at: new Date().toISOString() })
            .eq('id', userTask.id);
        } else {
          await supabase
            .from('user_tasks')
            .insert({
              user_id: user.id,
              task_id: task.id,
              status: 'completed',
              completed_at: new Date().toISOString(),
            });
        }
      }
    }

    queryClient.invalidateQueries({ queryKey: ['user-tasks'] });
  };

  return {
    tasks: tasksWithProgress,
    isLoading: isLoadingTasks || isLoadingUserTasks,
    claimReward: claimMutation.mutate,
    isClaiming: claimMutation.isPending,
    refreshTaskStatus,
    completedCount: tasksWithProgress.filter(t => t.isClaimed).length,
    totalCount: tasksWithProgress.length,
  };
};
