import { Tabs, useLocalSearchParams, usePathname } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function WorkspaceLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);
  const tabHeight = 56 + bottomInset;

  const params = useLocalSearchParams<{ id?: string }>();
  const pathname = usePathname();
  
  const rawId = params.id ?? pathname.split("/").filter(Boolean).pop();
  const scheduleId = rawId && rawId !== "schedule" && rawId !== "tasks" ? rawId : null;

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
          href: scheduleId ? { pathname: "/schedule/[id]", params: { id: scheduleId } } : null,
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
          href: scheduleId ? { pathname: "/tasks/[id]", params: { id: scheduleId } } : null,
          tabBarLabel: "Tasks",
          tabBarActiveTintColor: "#14213D",
          tabBarInactiveTintColor: "#5B6472",
          tabBarIcon: ({ color }) => (
            <Feather name="list" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="grades/[id]"
        options={{
          href: scheduleId ? { pathname: "/grades/[id]", params: { id: scheduleId } } : null,
          tabBarLabel: "Grades",
          tabBarActiveTintColor: "#14213D",
          tabBarInactiveTintColor: "#5B6472",
          tabBarIcon: ({ color }) => (
            <Feather name="star" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="back-to-dashboard"
        options={{
          href: "/dashboard",
          tabBarLabel: "Dashboard",
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
            marginTop: -4,
            paddingBottom: 4,
            color: "#8B1E3F",
          },
          tabBarActiveTintColor: "#8B1E3F",
          tabBarInactiveTintColor: "#8B1E3F",
          tabBarIcon: ({ color }) => (
            <Feather name="arrow-left" size={20} color="#8B1E3F" />
          ),
        }}
      />
    </Tabs>
  );
}