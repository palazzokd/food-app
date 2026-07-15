import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { useAuthStore } from '../store/authStore';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import FamilyProfileScreen from '../screens/family/FamilyProfileScreen';
import MemberEditScreen from '../screens/family/MemberEditScreen';
import DashboardScreen from '../screens/home/DashboardScreen';
import NutritionScreen from '../screens/home/NutritionScreen';
import MealPlannerScreen from '../screens/meals/MealPlannerScreen';
import GroceryListScreen from '../screens/grocery/GroceryListScreen';
import RecipeLibraryScreen from '../screens/recipes/RecipeLibraryScreen';
import RecipeDetailScreen from '../screens/recipes/RecipeDetailScreen';

const AuthStack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();
const RecipesStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const stackHeaderOptions = {
  headerStyle: { backgroundColor: colors.cream },
  headerTintColor: colors.forest,
  headerTitleStyle: { fontFamily: fonts.display, fontSize: 19, color: colors.forest },
  headerShadowVisible: false,
};

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={stackHeaderOptions}>
      <HomeStack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'FamilyPlate' }}
      />
      <HomeStack.Screen
        name="Nutrition"
        component={NutritionScreen}
        options={{ title: 'Nutrition Tracker' }}
      />
      <HomeStack.Screen
        name="Family"
        component={FamilyProfileScreen}
        options={{ title: 'My Family' }}
      />
      <HomeStack.Screen
        name="MemberEdit"
        component={MemberEditScreen}
        options={({ route }: any) => ({
          title: route.params?.member ? route.params.member.name : 'Add Member',
        })}
      />
    </HomeStack.Navigator>
  );
}

function RecipesNavigator() {
  return (
    <RecipesStack.Navigator screenOptions={stackHeaderOptions}>
      <RecipesStack.Screen
        name="RecipeLibrary"
        component={RecipeLibraryScreen}
        options={{ title: 'Recipe Library' }}
      />
      <RecipesStack.Screen
        name="RecipeDetail"
        component={RecipeDetailScreen}
        options={{ title: 'Recipe' }}
      />
    </RecipesStack.Navigator>
  );
}

function tabIcon(name: keyof typeof Ionicons.glyphMap, focusedName: keyof typeof Ionicons.glyphMap) {
  return ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
    <Ionicons name={focused ? focusedName : name} size={size} color={color} />
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.forest,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.divider,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: colors.cream },
        headerTintColor: colors.forest,
        headerTitleStyle: { fontFamily: fonts.display, fontSize: 19, color: colors.forest },
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeNavigator}
        options={{ headerShown: false, tabBarIcon: tabIcon('home-outline', 'home') }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          title: 'FamilyPlate AI',
          tabBarIcon: tabIcon('chatbubble-ellipses-outline', 'chatbubble-ellipses'),
        }}
      />
      <Tab.Screen
        name="Meals"
        component={MealPlannerScreen}
        options={{ title: 'Meal Planner', tabBarIcon: tabIcon('calendar-outline', 'calendar') }}
      />
      <Tab.Screen
        name="Recipes"
        component={RecipesNavigator}
        options={{ headerShown: false, tabBarIcon: tabIcon('book-outline', 'book') }}
      />
      <Tab.Screen
        name="Grocery"
        component={GroceryListScreen}
        options={{ title: 'Grocery List', tabBarIcon: tabIcon('cart-outline', 'cart') }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <MainTabs /> : <AuthNavigator />;
}
