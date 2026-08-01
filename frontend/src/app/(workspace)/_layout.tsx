import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function WorkspaceLayout() {
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
        name="schedule/[id]"
        options={{
          tabBarLabel: "Schedule",
          tabBarActiveTintColor: "#14213D",
          tabBarInactiveTintColor: "#5B6472",
          tabBarIcon: ({ color }) => (
            <Feather name="clock" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks/[id]"
        options={{
          tabBarLabel: "Tasks",
          tabBarActiveTintColor: "#14213D",
          tabBarInactiveTintColor: "#5B6472",
          tabBarIcon: ({ color }) => (
            <Feather name="list" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}