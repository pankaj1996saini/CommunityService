import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ComplaintListScreen from '../screens/ComplaintListScreen';
import ComplaintDetailScreen from '../screens/ComplaintDetailScreen';
import CreateComplaintScreen from '../screens/CreateComplaintScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ManageUsersScreen from '../screens/ManageUsersScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: ['home-outline', 'home'],
  Complaints: ['list-outline', 'list'],
  Users: ['people-outline', 'people'],
  Notifications: ['notifications-outline', 'notifications'],
  Profile: ['person-outline', 'person'],
};

const headerStyle = {
  headerStyle: { backgroundColor: '#fff' },
  headerTitleStyle: { fontWeight: '700', color: colors.text },
  headerTintColor: colors.primary,
  headerShadowVisible: false,
};

function MainTabs() {
  const { user } = useAuth();
  const { unread } = useNotifications();

  const listTitle = user.role === 'staff' ? 'My Tasks' : user.role === 'admin' ? 'All Complaints' : 'My Complaints';
  const listLabel = user.role === 'staff' ? 'Tasks' : 'Complaints';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...headerStyle,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarIcon: ({ focused, color, size }) => {
          const [off, on] = TAB_ICONS[route.name];
          return <Ionicons name={focused ? on : off} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: user.role === 'admin' ? 'Dashboard' : 'Home' }} />
      <Tab.Screen name="Complaints" component={ComplaintListScreen} options={{ title: listTitle, tabBarLabel: listLabel }} />
      {user.role === 'admin' ? (
        <Tab.Screen name="Users" component={ManageUsersScreen} options={{ title: 'People', tabBarLabel: 'People' }} />
      ) : null}
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications', tabBarLabel: 'Alerts', tabBarBadge: unread > 0 ? unread : undefined }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile', tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { user, booting } = useAuth();

  if (booting) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <Stack.Navigator screenOptions={headerStyle}>
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create account' }} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={headerStyle}>
      <Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="ComplaintDetail" component={ComplaintDetailScreen} options={{ title: 'Complaint' }} />
      {user.role === 'user' ? (
        <Stack.Screen name="CreateComplaint" component={CreateComplaintScreen} options={{ title: 'Report a problem' }} />
      ) : null}
    </Stack.Navigator>
  );
}
