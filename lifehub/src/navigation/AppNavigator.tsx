import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TodayScreen } from '../screens/TodayScreen';
import { DocumentsScreen } from '../screens/DocumentsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { useTheme } from '../hooks/useTheme';
import { useSettingsStore } from '../store/settingsStore';
import { typography, spacing } from '../constants/theme';
import { useTaskStore } from '../store/taskStore';

const Tab = createBottomTabNavigator();

export function AppNavigator() {
  const { theme, isDark } = useTheme();
  const { isOnboarded } = useSettingsStore();
  const overdueTasks = useTaskStore((s) => s.getOverdueTasks());
  const todayTasks = useTaskStore((s) => s.getTodayTasks());
  const urgentCount = overdueTasks.length + todayTasks.length;

  // Show onboarding if first launch
  if (!isOnboarded) {
    return (
      <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
        <OnboardingScreen />
      </NavigationContainer>
    );
  }

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      background: theme.background,
      card: theme.tabBar,
      border: theme.tabBarBorder,
      text: theme.textPrimary,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.tabBarActive,
          tabBarInactiveTintColor: theme.tabBarInactive,
          tabBarStyle: {
            backgroundColor: theme.tabBar,
            borderTopColor: theme.tabBarBorder,
            borderTopWidth: StyleSheet.hairlineWidth,
            paddingTop: 6,
            height: Platform.OS === 'ios' ? 84 : 64,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: typography.weight.semibold,
            marginBottom: Platform.OS === 'ios' ? 0 : 6,
          },
        }}
      >
        <Tab.Screen
          name="Today"
          component={TodayScreen}
          options={{
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons
                name={focused ? 'calendar-today' : 'calendar-today-outline'}
                size={size}
                color={color}
              />
            ),
            tabBarBadge: urgentCount > 0 ? urgentCount : undefined,
            tabBarBadgeStyle: {
              backgroundColor: theme.urgent,
              fontSize: 10,
              minWidth: 16,
              height: 16,
              lineHeight: 16,
            },
          }}
        />
        <Tab.Screen
          name="Documents"
          component={DocumentsScreen}
          options={{
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons
                name={focused ? 'folder' : 'folder-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons
                name={focused ? 'cog' : 'cog-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({});
