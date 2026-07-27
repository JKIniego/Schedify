import { useState } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Feather } from "@expo/vector-icons";

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
  }
];

export default function Index() {
  const { width } = useWindowDimensions();
  const wide = width >= 700;
  const [schedules, setSchedules] = useState(CLASS_SCHEDULES);

  const handleDelete = (id: string) => {
    setSchedules((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ alignItems: "center", paddingTop: 56, paddingBottom: 56 }}
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
          
          <View className="flex-row items-center justify-between mb-8">
            <Text className="text-brand-navy text-[28px] leading-[34px] font-extrabold">
              Dashboard
            </Text>

            <Pressable className="bg-brand-navy rounded-xl py-2.5 px-3.5 flex-row items-center gap-1.5 active:opacity-90">
              <Feather name="plus-circle" size={15} color="white" />
              <Text className="text-white text-xs font-bold">
                Create Sched
              </Text>
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
        </View>
      </ScrollView>
    </View>
  );
}