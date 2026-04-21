import { tabs } from "@/constants/data";
import { useAuth } from "@clerk/expo";
import { Redirect, Tabs } from "expo-router";
import { View, Image } from "react-native";
import clsx from 'clsx'
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, components } from "@/constants/theme";

const tabBar = components.tabBar;

export default function TabLayout() {
    const insets = useSafeAreaInsets();
    const { isLoaded, isSignedIn } = useAuth();

    if (!isLoaded) {
        return null;
    }

    if (!isSignedIn) {
        return <Redirect href="/(auth)/sign-in" />;
    }

    const TabIcons = ({ focused, icon }: TabIconProps) => {
        return (
            <View className="tabs-icon">
                <View className={clsx('tabs-pill', focused && 'tabs-active')}>
                    <Image source={icon} resizeMode="contain" className="tabs-glyph" />
                </View>
            </View>
        )
    }

    return <Tabs screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
            position: 'absolute',
            bottom: Math.max(insets.bottom, tabBar.horizontalInset),
            height: tabBar.height,
            marginHorizontal: tabBar.horizontalInset,
            borderRadius: tabBar.radius,
            backgroundColor: colors.primary,
            elevation: 0,
            borderTopWidth: 0,
        },
        tabBarItemStyle: {
            paddingVertical: tabBar.height / 2 - tabBar.iconFrame / 1.6
        },
        tabBarIconStyle: {
            width: tabBar.iconFrame,
            height: tabBar.iconFrame,
            alignItems: 'center',
        }

    }}>
        {
            tabs.map((tab) => (
                <Tabs.Screen
                    key={tab.name}
                    name={tab.name}
                    options={{
                        title: tab.title,
                        tabBarIcon: ({ focused }) => <TabIcons focused={focused} icon={tab.icon} />
                    }}
                />

            ))
        }
    </Tabs >;
}

