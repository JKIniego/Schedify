import { useState, useEffect, useCallback } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";
import { apiRequest } from "../../utils/api";

interface ClassSchedule {
  id: number;
  title: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function Dashboard() {
  const { width } = useWindowDimensions();
  const wide = width >= 700;

  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [newTitle, setNewTitle] = useState<string>("");
  const [isCreating, setIsCreating] = useState<boolean>(false);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) + " • " + date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  
  const fetchSchedules = useCallback(async () => {
    const { data, error } = await apiRequest<ClassSchedule[]>("/classes/");

    if (error) {
      Alert.alert("Error", error);
    } else if (data) {
      setSchedules(data);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);
  
  const handleCreate = async () => {
    if (!newTitle.trim()) {
      Alert.alert("Required", "Please enter a title for the schedule.");
      return;
    }

    setIsCreating(true);
    const { data, error } = await apiRequest<ClassSchedule>("/classes/", {
      method: "POST",
      body: JSON.stringify({
        title: newTitle.trim(),
        is_active: true,
      }),
    });

    setIsCreating(false);

    if (error) {
      Alert.alert("Create Failed", error);
    } else if (data) {
      setNewTitle("");
      fetchSchedules();
    }
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
          
          <View className="flex-row items-center justify-between mb-8">
            <Text className="text-brand-navy text-[28px] leading-[34px] font-extrabold">
              Dashboard
            </Text>

            <Pressable
              className="bg-brand-navy rounded-xl py-2.5 px-3.5 flex-row items-center gap-1.5 active:opacity-90"
            >
              <Feather name="plus-circle" size={15} color="white" />
              <Text className="text-white text-xs font-bold">Create Sched</Text>
            </Pressable>
          </View>

          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-brand-navy text-xs font-extrabold uppercase tracking-widest">
              Saved Schedules
            </Text>
          </View>
          
          {loading ? (
            <View className="py-12 items-center justify-center">
              <ActivityIndicator size="large" color="#14213D" />
            </View>
          ) : schedules.length === 0 ? (
            <View className="py-12 items-center justify-center rounded-xl bg-brand-card border border-brand-hair p-6">
              <Feather name="calendar" size={32} color="#5B6472" />
              <Text className="text-brand-navy text-base font-bold mt-3 mb-1">
                No schedules found
              </Text>
              <Text className="text-brand-slate text-xs text-center">
                Tap "Create Sched" above to start adding your weekly class schedules.
              </Text>
            </View>
          ) : (
            <View className="gap-3.5">
              {schedules.map((item) => (
                <View
                  key={item.id}
                  className="rounded-xl p-4 bg-brand-card border border-brand-hair"
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-base text-brand-navy font-bold flex-1 mr-2" numberOfLines={1}>
                      {item.title}
                    </Text>

                    {item.is_active && (
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
                      Created: <Text className="text-brand-navy font-semibold">{formatDate(item.created_at)}</Text>
                    </Text>
                  </View>

                  <View className="h-[1px] bg-brand-hair mb-3" />

                  <View className="flex-row items-center justify-end gap-2">
                    <Pressable className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-brand-hair active:bg-gray-50">
                      <Feather name="edit-2" size={13} color="#14213D" />
                      <Text className="text-xs text-brand-navy font-semibold">Edit</Text>
                    </Pressable>

                    <Pressable className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-brand-hair active:bg-red-50">
                      <Feather name="trash-2" size={13} color="#8B1E3F" />
                      <Text className="text-xs text-brand-crimson font-semibold">Delete</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}