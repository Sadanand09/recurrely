import "@/global.css";
import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-success">Welcome to Nativewind!</Text>

      <Link href="/(auth)/sign-in" className="mt-4 rounded bg-primary text-white p-4">Go to Sign In</Link>
      <Link href="/onboarding" className="mt-4 rounded bg-primary text-white p-4">Go to Onboarding</Link>
      <Link href="/(auth)/sign-up" className="mt-4 rounded bg-primary text-white p-4">Go to Sign Up</Link>

      <Link href="/subscriptions/spotify" className="mt-4 rounded bg-primary text-white p-4">Go to Spotify Subscription</Link>

      <Link href={{
        pathname: "/subscriptions/[id]",
        params: { id: "claude" },
      }}>Go to Claude Subscription</Link>
    </View>
  );
}
