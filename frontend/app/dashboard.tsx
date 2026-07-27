import { useState } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const CLASS_SCHEDULES = [
  {
    id: "1",
    scheduleName: "A.Y. 2026-2027 2nd Sem",
    createdAt: "Oct 24, 2025 • 09:30 AM",
    isActive: true,
  },
  {
    id: "2",
    scheduleName: "A.Y. 2026-2027 1st Sem",
    createdAt: "Oct 24, 2025 • 09:30 AM",
    isActive: false,
  },
  {
    id: "3",
    scheduleName: "A.Y. 2025-2026 2nd Sem",
    createdAt: "Oct 24, 2025 • 09:30 AM",
    isActive: false,
  },
  {
    id: "4",
    scheduleName: "A.Y. 2025-2026 1st Sem",
    createdAt: "Oct 24, 2025 • 09:30 AM",
    isActive: false,
  },
];

export default function Index() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const wide = width >= 700;

  const [schedules, setSchedules] = useState(CLASS_SCHEDULES);
  const [activeTab, setActiveTab] = useState<"dashboard" | "settings">("dashboard");

  const handleDelete = (id: string) => {
    setSchedules((prev) => prev.filter((item) => item.id !== id));
  };

  const handleLogout = () => {
    router.replace("/");
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <StatusBar style="dark" />
      
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ alignItems: "center", paddingTop: 24, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: "100%", maxWidth: 480, paddingHorizontal: wide ? 32 : 24 }}>
          <View className="flex-row items-center justify-between mb-8">
            <View className="flex-row items-center gap-2.5">
              <View className="w-9 h-9 rounded-md items-center justify-center border-[1.5px] border-brand-navy">
                <Text className="text-brand-navy text-sm font-bold">S</Text>
              </View>
              <Text className="text-brand-navy text-lg font-bold">Schedify</Text>
            </View>

            <View className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5 border border-brand-hair bg-brand-card">
              <Feather name="calendar" size={12} color="#14213D" />
              <Text className="text-brand-slate text-xs font-semibold">
                {schedules.length} Timetables
              </Text>
            </View>
          </View>

          {activeTab === "dashboard" ? (
            <>
              <View className="flex-row items-center justify-between mb-8">
                <Text className="text-brand-navy text-[28px] leading-[34px] font-extrabold">
                  Dashboard
                </Text>

                <Pressable className="bg-brand-navy rounded-xl py-2.5 px-3.5 flex-row items-center gap-1.5 active:opacity-90">
                  <Feather name="plus-circle" size={15} color="white" />
                  <Text className="text-white text-xs font-bold">Create Sched</Text>
                </Pressable>
              </View>

              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-brand-navy text-xs font-extrabold uppercase tracking-widest">
                  Saved Schedules
                </Text>
              </View>

              <View className="gap-3.5">
                {schedules.map((item) => (
                  <View
                    key={item.id}
                    className="rounded-xl p-4 bg-brand-card border border-brand-hair"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-base text-brand-navy font-bold flex-1 mr-2" numberOfLines={1}>
                        {item.scheduleName}
                      </Text>

                      {item.isActive && (
                        <View className="bg-brand-gold/15 border border-brand-gold/40 px-2 py-0.5 rounded-full">
                          <Text className="text-[10px] text-brand-navy font-extrabold uppercase">
                            Current
                          </Text>
                        </View>
                      )}
                    </View>

                    <View className="flex-row items-center gap-1.5 mb-3">
                      <Feather name="clock" size={12} color="#5B6472" />
                      <Text className="text-xs text-brand-slate font-medium">
                        Created: <Text className="text-brand-navy font-semibold">{item.createdAt}</Text>
                      </Text>
                    </View>

                    <View className="h-[1px] bg-brand-hair mb-3" />

                    <View className="flex-row items-center justify-end gap-2">
                      <Pressable className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-brand-hair active:bg-gray-50">
                        <Feather name="edit-2" size={13} color="#14213D" />
                        <Text className="text-xs text-brand-navy font-semibold">Edit</Text>
                      </Pressable>

                      <Pressable
                        className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-brand-hair active:bg-red-50"
                        onPress={() => handleDelete(item.id)}
                      >
                        <Feather name="trash-2" size={13} color="#8B1E3F" />
                        <Text className="text-xs text-brand-crimson font-semibold">Delete</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <View className="items-center justify-center py-12">
              <Text className="text-brand-navy text-2xl font-extrabold mb-2">Settings</Text>
              <Text className="text-brand-slate text-sm">App preferences & account settings.</Text>
            </View>
          )}
        </View>
      </ScrollView>
      
      <SafeAreaView edges={["bottom"]} className="bg-white border-t border-brand-hair items-center">
        <View 
          style={{ width: "100%", maxWidth: 480 }} 
          className="flex-row items-center justify-around py-2.5 px-4"
        >
          <Pressable
            onPress={() => setActiveTab("dashboard")}
            className="items-center py-1 px-3"
          >
            <Feather
              name="grid"
              size={20}
              color={activeTab === "dashboard" ? "#14213D" : "#5B6472"}
            />
            <Text
              className={`text-[11px] mt-1 font-semibold ${
                activeTab === "dashboard" ? "text-brand-navy" : "text-brand-slate"
              }`}
            >
              Dashboard
            </Text>
          </Pressable>
          
          <Pressable
            onPress={() => setActiveTab("settings")}
            className="items-center py-1 px-3"
          >
            <Feather
              name="settings"
              size={20}
              color={activeTab === "settings" ? "#14213D" : "#5B6472"}
            />
            <Text
              className={`text-[11px] mt-1 font-semibold ${
                activeTab === "settings" ? "text-brand-navy" : "text-brand-slate"
              }`}
            >
              Settings
            </Text>
          </Pressable>
          
          <Pressable
            onPress={handleLogout}
            className="items-center py-1 px-3"
          >
            <Feather name="log-out" size={20} color="#8B1E3F" />
            <Text className="text-[11px] mt-1 font-semibold text-brand-crimson">
              Log Out
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
}