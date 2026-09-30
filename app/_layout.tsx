import { DarkTheme, DefaultTheme } from '@react-navigation/native'; // Keep for reference if needed, but we use custom provider
import { ThemeProvider } from '@/context/ThemeContext';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';

// Load Fonts
import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_700Bold,
  Outfit_800ExtraBold
} from '@expo-google-fonts/outfit';

import { useColorScheme } from '@/hooks/use-color-scheme';

// unstable_settings removed to allow index.tsx to handle initial routing
// export const unstable_settings = {
//   anchor: '(tabs)',
// };

import { LanguageProvider } from '@/components/LanguageContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded, error] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_700Bold,
    Outfit_800ExtraBold,
  });



  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <LanguageProvider>
      <ThemeProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="admin" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          <Stack.Screen name="summary" options={{ headerShown: false }} />
          <Stack.Screen name="search" options={{ headerShown: false }} />

          <Stack.Screen name="explanation-result" options={{ headerShown: false }} />
          <Stack.Screen name="analysis_result" options={{ headerShown: false }} />
          <Stack.Screen name="quiz" options={{ headerShown: false }} />
          <Stack.Screen name="profile" options={{ headerShown: false }} />
          <Stack.Screen name="coding" options={{ headerShown: false }} />
          <Stack.Screen name="career_path" options={{ headerShown: false }} />
          <Stack.Screen name="exam_prep" options={{ headerShown: false }} />
          <Stack.Screen name="code_debugger" options={{ headerShown: false }} />
          <Stack.Screen name="concept_graph" options={{ headerShown: false }} />
          <Stack.Screen name="code_converter" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </LanguageProvider>
  );
}
