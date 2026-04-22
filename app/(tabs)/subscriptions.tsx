import SubscriptionCard from '@/components/SubscriptionCard'
import { useSubscriptionStore } from '@/lib/subscriptionStore'
import React, { useMemo, useState } from 'react'
import { FlatList, Keyboard, Text, TextInput, View } from 'react-native'
import { styled } from "nativewind";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);
const Subscriptions = () => {
    const { subscriptions } = useSubscriptionStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null);

    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filteredSubscriptions = useMemo(() => {
        if (!normalizedQuery) {
            return subscriptions;
        }

        return subscriptions.filter((subscription) => {
            const searchableFields = [
                subscription.name,
                subscription.plan,
                subscription.category,
                subscription.billing,
                subscription.paymentMethod,
                subscription.status,
            ];

            return searchableFields.some((value) =>
                value?.toLowerCase().includes(normalizedQuery)
            );
        });
    }, [normalizedQuery, subscriptions]);

    const handleSubscriptionPress = (subscriptionId: string) => {
        Keyboard.dismiss();
        setExpandedSubscriptionId((currentId) => currentId === subscriptionId ? null : subscriptionId);
    };

    return (
        <SafeAreaView className="flex-1  bg-background p-5">
            <View className="subs-header">
                <Text className="subs-title">Subscriptions</Text>
                <Text className="subs-subtitle">
                    Search your existing plans by name, category, billing, or payment method.
                </Text>
            </View>

            <View className="subs-search-wrap">
                <TextInput
                    className="subs-search-input"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search subscriptions"
                    placeholderTextColor="rgba(0, 0, 0, 0.45)"
                    autoCapitalize="none"
                    autoCorrect={false}
                    clearButtonMode="while-editing"
                    returnKeyType="search"
                    onSubmitEditing={() => Keyboard.dismiss()}
                />
            </View>

            <View className="subs-summary-row">
                <Text className="subs-summary-text">
                    {filteredSubscriptions.length} {filteredSubscriptions.length === 1 ? 'result' : 'results'}
                </Text>
                {normalizedQuery ? (
                    <Text className="subs-summary-text">for &quot;{searchQuery.trim()}&quot;</Text>
                ) : (
                    <Text className="subs-summary-text">showing all subscriptions</Text>
                )}
            </View>

            <FlatList
                data={filteredSubscriptions}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <SubscriptionCard
                        {...item}
                        expanded={expandedSubscriptionId === item.id}
                        onPress={() => handleSubscriptionPress(item.id)}
                    />
                )}
                extraData={expandedSubscriptionId}
                ItemSeparatorComponent={() => <View className="h-4" />}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                onScrollBeginDrag={() => Keyboard.dismiss()}
                ListEmptyComponent={
                    <View className="subs-empty-state">
                        <Text className="subs-empty-title">No subscriptions found</Text>
                        <Text className="subs-empty-copy">
                            Try a different keyword or clear the search to browse the full list.
                        </Text>
                    </View>
                }
                contentContainerClassName="pb-30"
            />
        </SafeAreaView>
    )
}

export default Subscriptions
