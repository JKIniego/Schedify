import { useState, useRef, useEffect } from "react";
import {
  ScrollView,
  Text,
  useWindowDimensions,
  View,
  Pressable,
  Modal,
  Animated,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { apiRequest } from "../../utils/api";

interface CourseAPIResponse {
  id: number;
  name: string;
  room: string;
  days: string[] | string | null;
  start_time: string;
  end_time: string;
  hex_code: string;
}

interface GridSlot {
  id: string;
  code: string;
  title: string;
  room: string;
  days: ("Mon" | "Tue" | "Wed" | "Thu" | "Fri")[];
  startHour: number;
  durationHours: number;
  timeDisplay: string;
  bgColor: string;
}

const HOURS = [
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
];

const DAYS: ("Mon" | "Tue" | "Wed" | "Thu" | "Fri")[] = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
];

const ROW_HEIGHT = 56;

const parseTimeToDecimal = (timeStr: string): number => {
  if (!timeStr) return 8;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours + minutes / 60;
};

const formatTimeDisplay = (startStr: string, endStr: string): string => {
  const formatSingle = (tStr: string) => {
    if (!tStr) return "";
    const [h, m] = tStr.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    const displayMin = m < 10 ? `0${m}` : m;
    return `${displayHour}:${displayMin}${period}`;
  };
  return `${formatSingle(startStr)}-${formatSingle(endStr)}`;
};

const parseDays = (
  days: CourseAPIResponse["days"]
): ("Mon" | "Tue" | "Wed" | "Thu" | "Fri")[] => {
  if (Array.isArray(days)) {
    return days as ("Mon" | "Tue" | "Wed" | "Thu" | "Fri")[];
  }
  if (typeof days === "string") {
    return days
      .split(",")
      .map((d) => d.trim()) as ("Mon" | "Tue" | "Wed" | "Thu" | "Fri")[];
  }
  return [];
};

const mapApiToGridSlot = (course: CourseAPIResponse): GridSlot => {
  const startDecimal = parseTimeToDecimal(course.start_time);
  const endDecimal = parseTimeToDecimal(course.end_time);
  const duration = Math.max(endDecimal - startDecimal, 0.5);

  return {
    id: String(course.id),
    code: course.name,
    title: course.name,
    room: course.room || "N/A",
    days: parseDays(course.days),
    startHour: startDecimal,
    durationHours: duration,
    timeDisplay: formatTimeDisplay(course.start_time, course.end_time),
    bgColor: course.hex_code || "#A5D6A7",
  };
};

export default function Schedule() {
  const { id: scheduleId } = useLocalSearchParams();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const wide = width >= 700;

  const [scheduleItems, setScheduleItems] = useState<GridSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [drawerVisible, setDrawerVisible] = useState(false);
  const drawerWidth = Math.min(width * 0.85, 320);
  const slideAnim = useRef(new Animated.Value(drawerWidth)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (scheduleId) {
      fetchCourses();
    }
  }, [scheduleId]);

  const fetchCourses = async () => {
    setLoading(true);
    const { data, error } = await apiRequest<CourseAPIResponse[]>(
      `/classes/${scheduleId}/courses/`
    );

    if (error) {
      Alert.alert("Error Loading Schedule", error);
    } else if (data) {
      const mapped = data.map(mapApiToGridSlot);
      setScheduleItems(mapped);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (drawerVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [drawerVisible]);

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: drawerWidth,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setDrawerVisible(false));
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <StatusBar style="light" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="bg-brand-navy pt-4 pb-8 items-center">
          <View
            style={{
              width: "100%",
              maxWidth: width,
              paddingHorizontal: wide ? 32 : 24,
            }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Pressable
                className="w-8 h-8 rounded-full bg-white/10 items-center justify-center active:bg-white/20"
                onPress={() => router.back()}
              >
                <Feather name="arrow-left" size={18} color="#FFFFFF" />
              </Pressable>

              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-lg bg-brand-gold items-center justify-center">
                  <Text className="text-brand-navy text-base font-black">S</Text>
                </View>
                <Text className="text-white text-lg font-bold tracking-wide">
                  SCHEDIFY
                </Text>
              </View>

              <Pressable
                className="bg-white/10 px-3 py-1.5 rounded-full flex-row items-center gap-1.5 active:bg-white/20"
                onPress={() => setDrawerVisible(true)}
              >
                <Feather name="list" size={14} color="#FFFFFF" />
                <Text className="text-white text-xs font-bold uppercase tracking-wider">
                  Courses
                </Text>
              </Pressable>
            </View>

            <Text className="text-white text-xl font-black uppercase tracking-wide text-center">
              1st Sem 2026 Schedule
            </Text>
          </View>
        </View>

        <View className="items-center py-6">
          <View
            style={{
              width: "100%",
              maxWidth: width,
              paddingHorizontal: wide ? 32 : 24,
            }}
          >
            <View className="items-center mb-6">
              <Text className="text-brand-navy text-xs font-black uppercase tracking-widest mb-1">
                Timetable Overview
              </Text>
              <View className="w-8 h-0.5 bg-brand-gold rounded-full" />
            </View>

            {loading ? (
              <View className="py-16 items-center justify-center">
                <ActivityIndicator size="large" color="#14213D" />
                <Text className="text-brand-slate text-xs mt-3 font-bold">
                  Fetching courses...
                </Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="rounded-2xl border border-brand-hair bg-white shadow-xs mb-6"
              >
                <View className="min-w-[620px]">
                  <View className="flex-row bg-brand-navy border-b border-brand-hair">
                    <View className="w-16 p-2 items-center justify-center border-r border-white/10">
                      <Feather name="clock" size={12} color="#C9A227" />
                    </View>

                    {DAYS.map((day) => (
                      <View
                        key={day}
                        className="flex-1 min-w-[105px] py-2.5 items-center justify-center border-r border-white/10"
                      >
                        <Text className="text-white text-xs font-black uppercase tracking-wider">
                          {day}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View className="flex-row relative">
                    <View className="w-16 border-r border-brand-hair bg-brand-card/40">
                      {HOURS.map((hour) => (
                        <View
                          key={hour}
                          style={{ height: ROW_HEIGHT }}
                          className="border-b border-brand-hair/60 justify-start pt-1 items-center"
                        >
                          <Text className="text-[10px] text-brand-slate font-bold">
                            {hour}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {DAYS.map((day) => (
                      <View
                        key={day}
                        className="flex-1 min-w-[105px] border-r border-brand-hair relative"
                      >
                        {HOURS.map((hour) => (
                          <View
                            key={hour}
                            style={{ height: ROW_HEIGHT }}
                            className="border-b border-brand-hair/30"
                          />
                        ))}

                        {scheduleItems
                          .filter((item) => item.days.includes(day))
                          .map((item) => {
                            const topOffset = (item.startHour - 8) * ROW_HEIGHT;
                            const blockHeight = item.durationHours * ROW_HEIGHT;

                            return (
                              <Pressable
                                key={`${item.id}-${day}`}
                                style={{
                                  position: "absolute",
                                  top: topOffset + 2,
                                  left: 2,
                                  right: 2,
                                  height: blockHeight - 4,
                                  backgroundColor: item.bgColor,
                                }}
                                className="border border-black/10 rounded-lg p-1.5 justify-between shadow-xs active:opacity-90"
                              >
                                <View>
                                  <Text
                                    className="text-[11px] font-black tracking-tight leading-tight text-black"
                                    numberOfLines={1}
                                  >
                                    {item.code}
                                  </Text>
                                  <Text className="text-[9px] text-black/80 font-bold mt-0.5">
                                    {item.timeDisplay}
                                  </Text>
                                </View>

                                <View className="flex-row items-center gap-1">
                                  <Feather name="map-pin" size={8} color="#000000" />
                                  <Text
                                    className="text-[9px] text-black font-extrabold uppercase"
                                    numberOfLines={1}
                                  >
                                    {item.room}
                                  </Text>
                                </View>
                              </Pressable>
                            );
                          })}
                      </View>
                    ))}
                  </View>
                </View>
              </ScrollView>
            )}

            <Pressable className="flex-row items-center justify-center gap-2 bg-brand-gold py-3.5 px-6 rounded-2xl active:opacity-90 shadow-xs">
              <Feather name="image" size={16} color="#14213D" />
              <Text className="text-brand-navy text-xs font-black uppercase tracking-wider">
                Export Schedule as Image
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={drawerVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeDrawer}
      >
        <View style={StyleSheet.absoluteFillObject}>
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                opacity: fadeAnim,
              },
            ]}
          >
            <Pressable style={StyleSheet.absoluteFillObject} onPress={closeDrawer} />
          </Animated.View>

          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              right: 0,
              width: drawerWidth,
              backgroundColor: "#FFFFFF",
              transform: [{ translateX: slideAnim }],
            }}
            className="shadow-2xl border-l border-brand-hair"
          >
            <SafeAreaView edges={["top", "bottom"]} className="flex-1 p-0">
              <View className="p-4 border-b border-brand-hair bg-white">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-brand-navy text-base font-black">
                      Manage Courses
                    </Text>
                    <Text className="text-brand-slate text-xs mt-0.5">
                      {scheduleItems.length} Enrolled
                    </Text>
                  </View>
                  <Pressable
                    className="w-8 h-8 rounded-full bg-brand-card items-center justify-center active:bg-brand-hair"
                    onPress={closeDrawer}
                  >
                    <Feather name="x" size={18} color="#14213D" />
                  </Pressable>
                </View>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} className="flex-1 p-4">
                {scheduleItems.length === 0 ? (
                  <Text className="text-brand-slate text-xs text-center py-8">
                    No active courses found.
                  </Text>
                ) : (
                  scheduleItems.map((item) => (
                    <View
                      key={item.id}
                      className="bg-brand-card border border-brand-hair rounded-xl p-3.5 mb-3 flex-row items-center justify-between shadow-xs"
                    >
                      <View className="flex-1 pr-3">
                        <Text className="text-brand-navy font-black text-sm">
                          {item.code}
                        </Text>
                        <Text className="text-brand-slate text-[11px] font-bold mt-0.5">
                          {item.days.join(", ")} • {item.timeDisplay}
                        </Text>
                        <Text className="text-brand-slate text-[10px] mt-0.5">
                          Room: {item.room}
                        </Text>
                      </View>

                      {/* Edit & Delete Action Buttons */}
                      <View className="flex-row items-center gap-1.5">
                        <Pressable className="w-8 h-8 rounded-lg bg-white border border-brand-hair items-center justify-center active:bg-brand-hair">
                          <Feather name="edit-2" size={14} color="#14213D" />
                        </Pressable>
                        <Pressable className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 items-center justify-center active:bg-red-100">
                          <Feather name="trash-2" size={14} color="#DC2626" />
                        </Pressable>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>

              {/* Add New Course Button Container */}
              <View className="p-4 border-t border-brand-hair bg-white">
                <Pressable className="flex-row items-center justify-center gap-2 bg-brand-navy py-3 px-4 rounded-xl active:opacity-90">
                  <Feather name="plus" size={16} color="#FFFFFF" />
                  <Text className="text-white text-xs font-bold uppercase tracking-wider">
                    Add New Course
                  </Text>
                </Pressable>
              </View>
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}