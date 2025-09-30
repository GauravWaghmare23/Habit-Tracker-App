import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

function RouteGaurd({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const isAuthGroup = segments[0] === "auth";

    if (mounted && !user && !isAuthGroup) {
      // redirect unauthenticated to index page
      router.replace("/auth");
    } else if (mounted && user && isAuthGroup) {
      // redirect authenticated users away from auth pages
      router.replace("/");
    }
  }, [mounted, user, segments]);

  if (!mounted) {
    return null;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <PaperProvider>
        <SafeAreaProvider>
          <RouteGaurd>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
            </Stack>
          </RouteGaurd>
        </SafeAreaProvider>
      </PaperProvider>
    </AuthProvider>
  )
}
