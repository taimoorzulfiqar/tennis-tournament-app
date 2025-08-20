import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { View, Text, StyleSheet } from 'react-native';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    console.log('=== ROOT LAYOUT AUTH CHECK ===', {
      user: user ? `exists (${user.email})` : 'null',
      isLoading,
      isInitializing,
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    });

    if (!isInitializing && !isLoading) {
      if (user) {
        console.log('User authenticated, navigating to app');
        router.replace('/(app)');
      } else {
        console.log('No user, navigating to auth');
        router.replace('/(auth)/sign-in');
      }
    }
  }, [user, isLoading, isInitializing]);

  // Error boundary
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Text style={styles.errorHint}>
          Please check your browser console for more details.
        </Text>
      </View>
    );
  }

  if (isInitializing || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.tennisCourt}>
          <View style={styles.net} />
          <View style={styles.ball1} />
          <View style={styles.ball2} />
        </View>
        <Text style={styles.appTitle}>Tennis Tournament App</Text>
        <Text style={styles.tagline}>Organize tournaments with ease</Text>
        <View style={styles.features}>
          <Text style={styles.feature}>🎾 Tournament Management</Text>
          <Text style={styles.feature}>🏆 Live Leaderboards</Text>
          <Text style={styles.feature}>👥 Player Profiles</Text>
        </View>
        <View style={styles.loadingSpinner}>
          <View style={styles.spinner} />
        </View>
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(app)" options={{ headerShown: false }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tennisCourt: {
    width: 120,
    height: 80,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    position: 'relative',
    marginBottom: 30,
    borderWidth: 2,
    borderColor: '#fff',
  },
  net: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#fff',
    transform: [{ translateX: -1 }],
  },
  ball1: {
    position: 'absolute',
    width: 12,
    height: 12,
    backgroundColor: '#fff',
    borderRadius: 6,
    top: 10,
    left: 20,
  },
  ball2: {
    position: 'absolute',
    width: 12,
    height: 12,
    backgroundColor: '#fff',
    borderRadius: 6,
    bottom: 10,
    right: 20,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: '#E8F5E8',
    marginBottom: 30,
    textAlign: 'center',
  },
  features: {
    alignItems: 'center',
    marginBottom: 40,
  },
  feature: {
    fontSize: 14,
    color: '#E8F5E8',
    marginBottom: 8,
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    width: 30,
    height: 30,
    borderWidth: 3,
    borderColor: '#E8F5E8',
    borderTopColor: 'transparent',
    borderRadius: 15,
    animation: 'spin 1s linear infinite',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#f44336',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorHint: {
    fontSize: 14,
    color: '#ffcdd2',
    textAlign: 'center',
  },
});
