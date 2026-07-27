import { Tabs, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const bottomInset = Math.max(insets.bottom, 8);
  const tabHeight = 56 + bottomInset;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelPosition: "below-icon",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: -2,
        },
        tabBarStyle: {
          height: tabHeight,
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E4E1D8",
          paddingTop: 6,
          paddingBottom: bottomInset,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarLabel: "Dashboard",
          tabBarActiveTintColor: "#14213D",
          tabBarInactiveTintColor: "#5B6472",
          tabBarIcon: ({ color }) => (
            <Feather name="grid" size={20} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="settings"
        options={{
          tabBarLabel: "Settings",
          tabBarActiveTintColor: "#14213D",
          tabBarInactiveTintColor: "#5B6472",
          tabBarIcon: ({ color }) => (
            <Feather name="settings" size={20} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="logout"
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.replace("/");
          },
        }}
        options={{
          tabBarLabel: "Log Out",
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
            marginTop: -4,
            paddingBottom: 4,
            color: "#8B1E3F",
          },
          tabBarActiveTintColor: "#8B1E3F",
          tabBarInactiveTintColor: "#8B1E3F",
          tabBarIcon: () => (
            <Feather name="log-out" size={20} color="#8B1E3F" />
          ),
        }}
      />
    </Tabs>
  );
}