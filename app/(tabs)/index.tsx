import "@/global.css"
import { Text, View } from "react-native";
import { Link } from "expo-router";

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-xl font-bold text-blue-500">
        Welcome to Nativewind!
        <Link href="/(auth)/sign-up"
          className="mt-4 rounded bg-primary text-white p-4 "
        >Go to Sign Up</Link>

        <Link href="/(auth)/sign-up"
          className="mt-4 rounded bg-primary text-white p-4  "
        >Go to Sign Up</Link>

        <Link href="/subscriptions/spotify"
          className="mt-4 rounded bg-primary text-white p-4  "
        >Spotify SUbscription
        </Link>


        <Link href={{
          pathname: "/subscriptions/[id]",
          params: { id: "claude" }
        }}>

          Claude Subscription
        </Link>
      </Text>
    </View >
  );
}