import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { theme } from '@/lib/theme';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AppLayout() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // Log every render
  console.log('=== APP LAYOUT RENDER ===', {
    user: user ? `exists (${user.email}, ${user.role})` : 'null',
    userType: typeof user,
    userKeys: user ? Object.keys(user) : 'N/A'
  });

  if (!user) {
    console.log('App layout - no user, returning null');
    return null;
  }

  console.log('App layout - rendering tabs for user:', user);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.gray[400],
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.gray[200],
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, 12) : 8,
          paddingTop: 8,
          height: Platform.OS === 'android' ? 68 + Math.max(insets.bottom, 12) : 60,
          ...theme.shadows.md,
          // Web-specific tab bar styling
          ...(Platform.OS === 'web' && {
            maxWidth: 1200,
            marginHorizontal: 'auto',
            borderRadius: theme.borderRadius.lg,
            margin: 16,
            borderTopWidth: 0,
            ...theme.shadows.lg,
          }),
        },
        tabBarLabelStyle: {
          fontSize: theme.typography.fontSize.xs,
          fontWeight: theme.typography.fontWeight.medium,
          marginTop: 4,
        },
        headerStyle: {
          backgroundColor: theme.colors.primary,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: theme.colors.white,
        headerTitleStyle: {
          fontWeight: theme.typography.fontWeight.semibold,
          fontSize: theme.typography.fontSize.lg,
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tournaments',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Leaderboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: 'Matches',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="tennisball" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      {(user.role === 'admin' || user.role === 'master') && (
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Admin',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings" size={size} color={color} />
            ),
          }}
        />
      )}
    </Tabs>
  );
}
