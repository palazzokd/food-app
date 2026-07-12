import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { colors } from '../theme/colors';
import { useAuthStore } from '../store/authStore';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import FamilyProfileScreen from '../screens/family/FamilyProfileScreen';

const AuthStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { borderTopColor: colors.divider },
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.textInverse,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          title: 'FamilyPlate',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>💬</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Family"
        component={FamilyProfileScreen}
        options={{
          title: 'My Family',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>👨‍👩‍👧‍👦</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <MainTabs /> : <AuthNavigator />;
}
