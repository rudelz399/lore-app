import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase'; 

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [session, setSession] = useState<any>(null);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    async function initializeApp() {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(currentSession);
        // Reduced delay to 3 seconds (9 was a bit long for UX!)
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (e) {
        console.warn("Lore Init Error:", e);
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    initializeApp();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => { authListener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!session && !inAuthGroup) {
      // Direct redirect to the login screen inside the auth folder
      router.replace('/auth/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, segments, isReady, router]);

  if (!isReady) {
    return (
      <View style={styles.splashFallback}>
        <Image 
          source={require('../assets/images/splash.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <ActivityIndicator size="small" color="#FFFFFF" style={styles.loader} />
      </View>
    );
  }

  return (
    <Stack>
  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
  {/* Remove name="auth" and use the specific screens if they aren't in a group folder */}
  <Stack.Screen name="auth/login" options={{ headerShown: false }} />
  <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
  <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
</Stack>
  );
}

const styles = StyleSheet.create({
  splashFallback: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  logo: { width: 200, height: 200 },
  loader: { position: 'absolute', bottom: 80 }
});