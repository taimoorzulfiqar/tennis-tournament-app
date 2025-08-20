import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export const useAuth = () => {
  const { setUser, setLoading, logout } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: currentUser, isLoading } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: authAPI.getCurrentUser,
    onSuccess: (data) => {
      console.log('=== AUTH QUERY SUCCESS ===');
      console.log('Auth query success:', data);
      setUser(data);
      console.log('User set in store');
    },
    onError: (error) => {
      console.log('=== AUTH QUERY ERROR ===');
      console.log('Auth query error:', error);
      setUser(null);
      console.log('User cleared from store');
    },
    retry: false,
  });

  const signInMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authAPI.signIn(email, password),
    onSuccess: (data) => {
      console.log('=== SIGN IN MUTATION SUCCESS ===');
      console.log('Sign in success:', data);
      console.log('Invalidating auth queries...');
      // Refetch user data after successful sign in
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
      console.log('Auth queries invalidated');
      
      // Force a refetch to see what happens
      setTimeout(() => {
        console.log('=== FORCING REFETCH ===');
        queryClient.refetchQueries({ queryKey: ['auth', 'user'] });
      }, 100);
    },
    onError: (error) => {
      console.log('=== SIGN IN MUTATION ERROR ===');
      console.log('Sign in error:', error);
    },
  });

  const signUpMutation = useMutation({
    mutationFn: ({ 
      email, 
      password, 
      fullName, 
      role 
    }: { 
      email: string; 
      password: string; 
      fullName: string; 
      role: 'admin' | 'player' 
    }) => authAPI.signUp(email, password, fullName, role),
  });

  const signOutMutation = useMutation({
    mutationFn: authAPI.signOut,
    onSuccess: () => {
      logout();
      queryClient.clear();
    },
  });

  // Log current state
  console.log('=== USE AUTH STATE ===', {
    currentUser: currentUser ? 'exists' : 'null',
    isLoading,
    signInPending: signInMutation.isPending
  });

  return {
    user: currentUser,
    isLoading: isLoading || signInMutation.isPending,
    signIn: signInMutation.mutate,
    signUp: signUpMutation.mutate,
    signOut: signOutMutation.mutate,
    isSigningIn: signInMutation.isPending,
    isSigningUp: signUpMutation.isPending,
    isSigningOut: signOutMutation.isPending,
  };
};
