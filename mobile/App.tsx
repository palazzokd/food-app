import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { useAuthStore } from './src/store/authStore';
import { colors } from './src/theme/colors';

export default function App() {
  const { isLoading, restoreSession } = useAuthStore();

  useEffect(() => {
    restoreSession();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <AppNavigator />
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
