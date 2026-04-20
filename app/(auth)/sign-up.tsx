
import { Text, View } from "react-native";
import { Link } from "expo-router";

function SignUp() {
    return (
        <View>
            <Text>Sign Up Page</Text>
            <Link href="/(auth)/sign-in"

                className="bg-gray-400 text-xl ">
                Already have account ? Login
            </Link>

        </View>
    )
}


export default SignUp;