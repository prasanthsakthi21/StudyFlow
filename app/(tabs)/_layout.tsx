import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/context/ThemeContext'; // Import Theme Context

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { theme } = useTheme(); // Use Theme

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          elevation: 0,
          borderTopWidth: 1,
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="home" color={color} />,
        }}
      />

      <Tabs.Screen
        name="explainer"
        options={{
          title: 'Algorithms',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="school-outline" color={color} />,
        }}
      />

      <Tabs.Screen
        name="code_explainer"
        options={{
          title: 'Code AI',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="code-slash" color={color} />,
        }}
      />

      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="library-outline" color={color} />,
        }}
      />


      <Tabs.Screen
        name="quizzes"
        options={{
          title: 'Quiz',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="help-circle-outline" color={color} />,
        }}
      />
    </Tabs>
  );
}
