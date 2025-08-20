import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userAPI } from '@/lib/api';

export const useUsers = () => {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: userAPI.getUsers,
  });

  const { data: players = [], isLoading: playersLoading } = useQuery({
    queryKey: ['players'],
    queryFn: userAPI.getPlayers,
  });

  const createUserMutation = useMutation({
    mutationFn: userAPI.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: any }) =>
      userAPI.updateProfile(userId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['players'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: userAPI.updatePassword,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
    },
  });

  return {
    users,
    players,
    isLoading: isLoading || playersLoading,
    createUser: createUserMutation.mutate,
    updateProfile: updateProfileMutation.mutate,
    updatePassword: updatePasswordMutation.mutate,
    isCreatingUser: createUserMutation.isPending,
    isUpdatingProfile: updateProfileMutation.isPending,
    isUpdatingPassword: updatePasswordMutation.isPending,
  };
};
