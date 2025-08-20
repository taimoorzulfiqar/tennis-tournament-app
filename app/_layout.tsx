import { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/lib/theme';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function AppContent() {
  const { user, isLoading } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Give some time for auth state to initialize
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Handle authentication routing
  useEffect(() => {
    console.log('=== ROOT LAYOUT AUTH CHECK ===', {
      user: user ? `exists (${user.email})` : 'null',
      isLoading,
      isInitializing
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

  if (isInitializing || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        {/* Background gradient effect */}
        <View style={styles.backgroundGradient}>
          <View style={styles.topCircle} />
          <View style={styles.bottomCircle} />
        </View>
        
        <View style={styles.loadingContent}>
          {/* Tennis court icon */}
          <View style={styles.tennisCourt}>
            <View style={styles.courtOutline}>
              <View style={styles.courtCenter}>
                <View style={styles.net} />
                <View style={styles.centerLine} />
              </View>
            </View>
            <View style={styles.tennisBall}>
              <Ionicons name="tennisball" size={32} color={theme.colors.secondary} />
            </View>
          </View>
          
          {/* App title */}
          <Text style={styles.appTitle}>Tennis Tournament</Text>
          <Text style={styles.appSubtitle}>Organize • Compete • Win</Text>
          
          {/* Loading indicator */}
          <View style={styles.loadingSection}>
            <ActivityIndicator size="large" color={theme.colors.primary} style={styles.spinner} />
            <Text style={styles.loadingText}>Preparing your tournament experience...</Text>
          </View>
          
          {/* Feature highlights */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Ionicons name="trophy" size={20} color={theme.colors.primary} />
              <Text style={styles.featureText}>Tournaments</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="list" size={20} color={theme.colors.primary} />
              <Text style={styles.featureText}>Leaderboards</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="tennisball" size={20} color={theme.colors.primary} />
              <Text style={styles.featureText}>Matches</Text>
            </View>
          </View>
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
    backgroundColor: theme.colors.background,
    position: 'relative',
    // Web-specific optimizations
    ...(Platform.OS === 'web' && {
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }),
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topCircle: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: theme.colors.primary + '10',
  },
  bottomCircle: {
    position: 'absolute',
    bottom: -150,
    left: -150,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: theme.colors.secondary + '10',
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    // Web-specific responsive design
    ...(Platform.OS === 'web' && {
      maxWidth: 600,
      marginHorizontal: 'auto',
      paddingHorizontal: theme.spacing['2xl'],
    }),
  },
  tennisCourt: {
    position: 'relative',
    marginBottom: theme.spacing['2xl'],
  },
  courtOutline: {
    width: 120,
    height: 80,
    borderWidth: 3,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.lg,
  },
  courtCenter: {
    width: 100,
    height: 60,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary + '10',
    position: 'relative',
  },
  net: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: theme.colors.white,
    transform: [{ translateY: -1 }],
  },
  centerLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 2,
    backgroundColor: theme.colors.white,
    transform: [{ translateX: -1 }],
  },
  tennisBall: {
    position: 'absolute',
    top: -15,
    right: -15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  appTitle: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.black,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
    // Web-specific typography
    ...(Platform.OS === 'web' && {
      fontSize: 48,
      letterSpacing: -0.5,
    }),
  },
  appSubtitle: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.gray[600],
    marginBottom: theme.spacing['2xl'],
    textAlign: 'center',
    fontWeight: theme.typography.fontWeight.medium,
    // Web-specific typography
    ...(Platform.OS === 'web' && {
      fontSize: 20,
      letterSpacing: 0.5,
    }),
  },
  loadingSection: {
    alignItems: 'center',
    marginBottom: theme.spacing['2xl'],
  },
  spinner: {
    marginBottom: theme.spacing.lg,
  },
  loadingText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[600],
    textAlign: 'center',
    lineHeight: 22,
    // Web-specific typography
    ...(Platform.OS === 'web' && {
      fontSize: 16,
      lineHeight: 24,
    }),
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 300,
    // Web-specific responsive design
    ...(Platform.OS === 'web' && {
      maxWidth: 400,
      gap: theme.spacing.lg,
    }),
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[600],
    marginTop: theme.spacing.xs,
    textAlign: 'center',
    fontWeight: theme.typography.fontWeight.medium,
    // Web-specific typography
    ...(Platform.OS === 'web' && {
      fontSize: 14,
      marginTop: theme.spacing.sm,
    }),
  },
});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
