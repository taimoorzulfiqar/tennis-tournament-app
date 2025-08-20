import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authAPI } from '../lib/api'
import { useAuthStore } from '../stores/authStore'
import { useEffect } from 'react'

export const useAuth = () => {
  const queryClient = useQueryClient()
  const { user, setUser, setLoading } = useAuthStore()

  // Query to get current user
  const { data: currentUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authAPI.getCurrentUser,
    retry: false,
  })

  // Update store when user data changes
  useEffect(() => {
    setUser(currentUser || null)
    setLoading(false)
  }, [currentUser, setUser, setLoading])

  // Sign in mutation
  const signInMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authAPI.signIn(email, password),
    onSuccess: (user) => {
      setUser(user)
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
    },
    onError: (error) => {
      console.error('Sign in error:', error)
    },
  })

  // Sign up mutation
  const signUpMutation = useMutation({
    mutationFn: ({ email, password, full_name, role }: { 
      email: string; 
      password: string; 
      full_name: string; 
      role: 'admin' | 'player' 
    }) => authAPI.signUp(email, password, full_name, role),
    onSuccess: (user) => {
      setUser(user)
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
    },
    onError: (error) => {
      console.error('Sign up error:', error)
    },
  })

  // Sign out mutation
  const signOutMutation = useMutation({
    mutationFn: authAPI.signOut,
    onSuccess: () => {
      setUser(null)
      queryClient.clear()
    },
    onError: (error) => {
      console.error('Sign out error:', error)
    },
  })

  return {
    user,
    isLoading: isLoadingUser || signInMutation.isPending,
    signInMutation,
    signUpMutation,
    signOutMutation,
  }
}
