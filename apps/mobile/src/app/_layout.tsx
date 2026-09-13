import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  EBGaramond_400Regular,
  EBGaramond_500Medium,
  EBGaramond_600SemiBold,
  EBGaramond_700Bold,
} from '@expo-google-fonts/eb-garamond';
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
} from '@expo-google-fonts/hanken-grotesk';
import { AstuColors } from '@/constants/theme';
import { StoreProvider } from '@/context/StoreContext';
import { hasCompletedOnboarding } from '@/lib/storage';
import { setAssetsBaseUrl } from '@astu/shared';
import { API_BASE_URL } from '@/lib/auth-client';

if (API_BASE_URL) {
  setAssetsBaseUrl(API_BASE_URL);
}

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const [fontsLoaded, fontError] = useFonts({
    EBGaramond_400Regular,
    EBGaramond_500Medium,
    EBGaramond_600SemiBold,
    EBGaramond_700Bold,
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
  });

  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);

  useEffect(() => {
    async function checkFirstLaunch() {
      try {
        const completed = await hasCompletedOnboarding();
        setShouldShowOnboarding(!completed);
      } catch {
        setShouldShowOnboarding(false);
      } finally {
        setOnboardingChecked(true);
      }
    }
    checkFirstLaunch();
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && onboardingChecked) {
      SplashScreen.hideAsync();
      if (shouldShowOnboarding) {
        router.replace('/onboarding' as any);
      }
    }
  }, [fontsLoaded, fontError, onboardingChecked, shouldShowOnboarding, router]);

  if ((!fontsLoaded && !fontError) || !onboardingChecked) {
    return null;
  }

  return (
    <StoreProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: AstuColors.background },
        }}>
        <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="product-details" options={{ headerShown: false }} />
        <Stack.Screen name="checkout" options={{ headerShown: false }} />
        <Stack.Screen name="track-order" options={{ headerShown: false }} />
        <Stack.Screen name="wishlist" options={{ headerShown: false }} />
        <Stack.Screen name="search" options={{ headerShown: false }} />
      </Stack>
    </StoreProvider>
  );
}


