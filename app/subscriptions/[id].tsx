import { View, Text } from 'react-native'
import React from 'react'
import { Link, useLocalSearchParams } from 'expo-router'

const Subscriptions = () => {
    const { id } = useLocalSearchParams<{ id: string }>()
    return (
        <View>
            <Text>Subscriptions Details :{id}</Text>
            <Link href="/">Go to Back</Link>
        </View>
    )
}

export default Subscriptions