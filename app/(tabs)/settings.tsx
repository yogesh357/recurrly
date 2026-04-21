import { useClerk, useUser } from '@clerk/expo';
import { Text, View, Pressable } from 'react-native'
import React from 'react'


import { styled } from "nativewind";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);
const settings = () => {
    const { signOut } = useClerk();
    const { user } = useUser();

    return (
        <SafeAreaView className="flex-1  bg-background p-5">
            <View className='rounded-2xl border border-border bg-card p-5'>
                <Text className='text-2xl font-sans-bold text-primary'>Settings</Text>
                <Text className='mt-2 text-sm font-sans-medium text-muted-foreground'>
                    Signed in as {user?.primaryEmailAddress?.emailAddress || user?.id || 'account owner'}
                </Text>

                <Pressable
                    className='mt-5 items-center rounded-2xl bg-primary py-4'
                    onPress={() => signOut({ redirectUrl: '/(auth)/sign-in' })}
                >
                    <Text className='font-sans-bold text-background'>Sign out</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    )
}

export default settings