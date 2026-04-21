import "@/global.css";
import { FlatList, Image, Text, View } from "react-native";
import { Link } from "expo-router";
import { styled } from "nativewind";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import images from "@/constants/images";
import { HOME_BALANCE, HOME_SUBSCRIPTIONS, HOME_USER, UPCOMING_SUBSCRIPTIONS } from "@/constants/data";
import { icons } from "@/constants/icons";
import dayjs from "dayjs";
import { formatCurrency } from "@/lib/utils";
import ListHeading from "@/components/ListHeading";
import UpcomingSubscriptionCard from "@/components/UpcomingSubscriptionCard";
import SubscriptionCard from "@/components/SubscriptionCard";
import { useState } from "react";

const SafeAreaView = styled(RNSafeAreaView);

export default function App() {
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null);


  return (
    <SafeAreaView className="flex-1  bg-background p-5">
      <View className="home-header">
        <View className="home-user">
          <Image source={images.avatar} className="home-avatar" />
          <Text className="home-user-name">{HOME_USER.name}</Text>
        </View>
        <Image source={icons.add} className="home-add-icon" />
      </View>
      <View className="home-balance-card">
        <Text className="home-balance-label">Balance</Text>

        <View className="home-balance-row">
          <Text className="home-balance-amount">
            {formatCurrency(HOME_BALANCE.amount)}
          </Text>
          <Text className="home-balance-date">
            {dayjs(HOME_BALANCE.nextRenewalDate).format('MM/DD')}
          </Text>
        </View>
      </View>

      <View>
        <ListHeading title="Upcomming" />
        <FlatList data={UPCOMING_SUBSCRIPTIONS}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          ListEmptyComponent={<Text className="home-empty-state" >No Upcoming renewals yet .</Text>}
          renderItem={({ item }) => (
            <UpcomingSubscriptionCard {...item} />
          )} />
      </View>
      <View>
        <ListHeading title="All Subscriptions" />
        <FlatList data={HOME_SUBSCRIPTIONS}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text className="home-empty-state" >No subscriptions found .</Text>}
          renderItem={({ item }) => (
            <SubscriptionCard
              expanded={expandedSubscriptionId === item.id}
              onPress={() => setExpandedSubscriptionId((currentId) => (
                currentId === item.id ? null : item.id
              ))}
              {...item} />
          )}
          extraData={expandedSubscriptionId}
          ItemSeparatorComponent={() => <View className="h-4 " />}
          showsVerticalScrollIndicator={false}

        />
      </View>
    </SafeAreaView >
  );
}
