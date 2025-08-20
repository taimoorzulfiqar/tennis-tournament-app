import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userAPI } from '../lib/api';

export const useUsers = () => {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: userAPI.getUsers,
  });

  const createUserMutation = useMutation({
    mutationFn: userAPI.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: any }) =>
      userAPI.updateProfile(userId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
    },
  });

  return {
    users,
    isLoading,
    createUser: createUserMutation.mutate,
    updateProfile: updateProfileMutation.mutate,
    isCreatingUser: createUserMutation.isPending,
    isUpdatingProfile: updateProfileMutation.isPending,
  };
};
