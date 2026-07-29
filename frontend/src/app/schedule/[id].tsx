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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

interface GridSlot {
  id: string;
  code: string;
  title: string;
  room: string;
  days: ("Mon" | "Tue" | "Wed" | "Thu" | "Fri")[];
  startHour: number;
  durationHours: number;
  timeDisplay: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
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

const SCHEDULE_ITEMS: GridSlot[] = [
  {
    id: "1",
    code: "SAS 1 - B",
    title: "SAS 1",
    room: "DM-04",
    days: ["Mon", "Thu"],
    startHour: 8.5,
    durationHours: 1.5,
    timeDisplay: "8:30AM-10:00AM",
    bgClass: "bg-[#A5D6A7]",
    borderClass: "border-[#81C784]",
    textClass: "text-[#1B5E20]",
  },
  {
    id: "2",
    code: "SOC SCI 5 - C1",
    title: "SOC SCI 5",
    room: "R23",
    days: ["Mon", "Thu"],
    startHour: 10.0,
    durationHours: 1.5,
    timeDisplay: "10:00AM-11:30AM",
    bgClass: "bg-[#CE93D8]",
    borderClass: "border-[#BA68C8]",
    textClass: "text-[#4A148C]",
  },
  {
    id: "3",
    code: "CMSC 135 - D Lec",
    title: "CMSC 135",
    room: "CS LAB 1",
    days: ["Mon", "Thu"],
    startHour: 12.0,
    durationHours: 1.0,
    timeDisplay: "12:00PM-1:00PM",
    bgClass: "bg-[#C8E6C9]",
    borderClass: "border-[#A5D6A7]",
    textClass: "text-[#2E7D32]",
  },
  {
    id: "4",
    code: "CMSC 135 - E Lab",
    title: "CMSC 135",
    room: "CS LAB 2",
    days: ["Mon", "Thu"],
    startHour: 13.0,
    durationHours: 1.5,
    timeDisplay: "1:00PM-2:30PM",
    bgClass: "bg-[#DCE775]",
    borderClass: "border-[#C0CA33]",
    textClass: "text-[#33691E]",
  },
  {
    id: "5",
    code: "CMSC 196 - J Lec",
    title: "CMSC 196",
    room: "CS LAB 1",
    days: ["Tue"],
    startHour: 9.0,
    durationHours: 1.0,
    timeDisplay: "9:00AM-10:00AM",
    bgClass: "bg-[#FFE082]",
    borderClass: "border-[#FFCA28]",
    textClass: "text-[#E65100]",
  },
  {
    id: "6",
    code: "CMSC 174 - M Lec",
    title: "CMSC 174",
    room: "CS Lecture Room 2",
    days: ["Tue", "Fri"],
    startHour: 13.0,
    durationHours: 1.5,
    timeDisplay: "1:00PM-2:30PM",
    bgClass: "bg-[#EF9A9A]",
    borderClass: "border-[#E57373]",
    textClass: "text-[#B71C1C]",
  },
  {
    id: "7",
    code: "CMSC 199.2 - N1",
    title: "CMSC 199.2",
    room: "CS Lab 3",
    days: ["Tue", "Fri"],
    startHour: 14.5,
    durationHours: 1.5,
    timeDisplay: "2:30PM-4:00PM",
    bgClass: "bg-[#FFCC80]",
    borderClass: "border-[#FFB74D]",
    textClass: "text-[#E65100]",
  },
];

const ROW_HEIGHT = 56;

export default function Schedule() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const wide = width >= 700;

  const [scheduleItems, setScheduleItems] = useState<GridSlot[]>(SCHEDULE_ITEMS);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const drawerWidth = Math.min(width * 0.85, 320);
  const slideAnim = useRef(new Animated.Value(drawerWidth)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

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

  const handleDeleteCourse = (itemId: string) => {
    setScheduleItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleEditCourse = (item: GridSlot) => {
    console.log("Edit course:", item.code);
  };

  const handleAddCourse = () => {
    console.log("Add course pressed");
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <StatusBar style="light" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="bg-brand-navy pt-4 pb-8 items-center">
          <View style={{ width: "100%", maxWidth: 480, paddingHorizontal: wide ? 32 : 24 }}>
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
                <Text className="text-white text-lg font-bold tracking-wide">SCHEDIFY</Text>
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
          <View style={{ width: "100%", maxWidth: 480, paddingHorizontal: wide ? 32 : 24 }}>
            <View className="items-center mb-6">
              <Text className="text-brand-navy text-xs font-black uppercase tracking-widest mb-1">
                Timetable Overview
              </Text>
              <View className="w-8 h-0.5 bg-brand-gold rounded-full" />
            </View>

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
                        <Text className="text-[10px] text-brand-slate font-bold">{hour}</Text>
                      </View>
                    ))}
                  </View>

                  {DAYS.map((day) => (
                    <View key={day} className="flex-1 min-w-[105px] border-r border-brand-hair relative">
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
                              }}
                              className={`${item.bgClass} ${item.borderClass} border rounded-xl p-1.5 justify-between shadow-xs active:opacity-90`}
                            >
                              <View>
                                <Text
                                  className={`text-[11px] font-black tracking-tight leading-tight ${item.textClass}`}
                                  numberOfLines={1}
                                >
                                  {item.code}
                                </Text>
                                <Text className="text-[9px] text-brand-navy/80 font-bold mt-0.5">
                                  {item.timeDisplay}
                                </Text>
                              </View>

                              <View className="flex-row items-center gap-1">
                                <Feather name="map-pin" size={8} color="#14213D" />
                                <Text
                                  className="text-[9px] text-brand-navy font-extrabold uppercase"
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
                <View className="flex-row items-center justify-between mb-3">
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
                
                <Pressable
                  className="bg-brand-navy flex-row items-center justify-center gap-2 py-2.5 px-4 rounded-xl active:opacity-90 shadow-xs"
                  onPress={handleAddCourse}
                >
                  <Feather name="plus" size={16} color="#FFFFFF" />
                  <Text className="text-white text-xs font-bold uppercase tracking-wider">
                    Add Course
                  </Text>
                </Pressable>
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
                        <Text className="text-brand-navy font-black text-sm">{item.code}</Text>
                        <Text className="text-brand-slate text-[11px] font-bold mt-0.5">
                          {item.days.join(", ")} • {item.timeDisplay}
                        </Text>
                        <Text className="text-brand-slate text-[10px] mt-0.5">
                          Room: {item.room}
                        </Text>
                      </View>

                      <View className="flex-row items-center gap-1.5">
                        <Pressable
                          className="w-8 h-8 rounded-lg bg-white border border-brand-hair items-center justify-center active:bg-brand-card"
                          onPress={() => handleEditCourse(item)}
                        >
                          <Feather name="edit-2" size={13} color="#14213D" />
                        </Pressable>

                        <Pressable
                          className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 items-center justify-center active:bg-red-100"
                          onPress={() => handleDeleteCourse(item.id)}
                        >
                          <Feather name="trash-2" size={13} color="#DC2626" />
                        </Pressable>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}