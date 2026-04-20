
import { Text, View } from "react-native";
import { Link } from "expo-router";

function SignIn() {
    return (
        <View>
            <Text>Sign in Page</Text>
            <Link href="/(auth)/sign-up"
                className="bg-gray-400 text-xl ">
                Donot have account ? Signup
            </Link>

        </View>
    )
}

export default SignIn;
