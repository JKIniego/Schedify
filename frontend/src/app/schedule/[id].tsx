import { useState, useRef, useEffect } from "react";
import {
  ScrollView,
  Text,
  TextInput,
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
import { CustomAlertModal, AlertState } from "../../utils/alert";

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
  rawStartTime: string;
  rawEndTime: string;
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

const COURSE_COLORS = [
  "#FAF1F1", "#FAF5F1", "#FAF9F1", "#F2FAF4", "#F1F6FA", "#F5F1FA", "#FAF1F6",
  "#F5C7C7", "#F5DDD7", "#F5F2C7", "#CEF5D6", "#C7E0F5", "#E0C7F5", "#F5C7DF",
  "#F2A8A8", "#F2CDA8", "#F2ECA8", "#A8F2B9", "#A8CFF2", "#CFA8F2", "#F2A8CD",
  "#EE8B8B", "#EEBD8B", "#EEE58B", "#8BEEA3", "#8BBEEE", "#BE8BEE", "#EE8BBD",
  "#EA7070", "#EAAD70", "#EADE70", "#70EA8D", "#70ADEA", "#AD70EA", "#EA70AD",
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
    rawStartTime: course.start_time || "",
    rawEndTime: course.end_time || "",
  };
};

export default function Schedule() {
  const { id: scheduleId } = useLocalSearchParams();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const wide = width >= 700;
  
  const horizontalPadding = wide ? 64 : 48;
  const availableWidth = width - horizontalPadding;
  const timeColWidth = Math.max(54, Math.floor(availableWidth * 0.12));
  const minDayColWidth = 95;
  const calculatedDayColWidth = Math.floor(
    (availableWidth - timeColWidth) / DAYS.length
  );
  const dayColWidth = Math.max(minDayColWidth, calculatedDayColWidth);
  const totalGridWidth = timeColWidth + dayColWidth * DAYS.length;

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

  const [isColorDropdownOpen, setIsColorDropdownOpen] = useState(false);

  const [addCourseModal, setAddCourseModal] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseName, setCourseName] = useState<string>("");
  const [room, setRoom] = useState<string>("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [hexCode, setHexCode] = useState<string>("#A5D6A7");
  const [isAddingCourse, setIsAddingCourse] = useState<boolean>(false);
  const [errors, setErrors] = useState<{
    courseName?: string;
    room?: string;
    selectedDays?: string;
    startTime?: string;
    endTime?: string;
  }>({});

  const closeAddCourseModal = () => {
    setAddCourseModal(false);
    setEditingCourseId(null);
    setCourseName("");
    setRoom("");
    setSelectedDays([]);
    setStartTime("");
    setEndTime("");
    setHexCode("#A5D6A7");
    setIsColorDropdownOpen(false);
    setErrors({});
  };

  const handleOpenEditModal = (item: GridSlot) => {
    setEditingCourseId(item.id);
    setCourseName(item.title);
    setRoom(item.room === "N/A" ? "" : item.room);
    setSelectedDays(item.days);
    setStartTime(item.rawStartTime);
    setEndTime(item.rawEndTime);
    setHexCode(item.bgColor);
    setAddCourseModal(true);
  };

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSaveCourse = async () => {
    const newErrors: typeof errors = {};

    if (!courseName.trim()) {
      newErrors.courseName = "Course name is required.";
    }
    if (!room.trim()) {
      newErrors.room = "Room / Location is required.";
    }
    if (selectedDays.length === 0) {
      newErrors.selectedDays = "Select at least one day.";
    }
    if (!startTime.trim()) {
      newErrors.startTime = "Start time is required.";
    }
    if (!endTime.trim()) {
      newErrors.endTime = "End time is required.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsAddingCourse(true);

    const isEditing = Boolean(editingCourseId);
    const endpoint = isEditing
      ? `/courses/${editingCourseId}/`
      : `/classes/${scheduleId}/courses/`;
    const method = isEditing ? "PATCH" : "POST";

    const { data, error } = await apiRequest<CourseAPIResponse>(endpoint, {
      method,
      body: JSON.stringify({
        name: courseName.trim(),
        room: room.trim(),
        days: selectedDays,
        start_time: startTime.trim(),
        end_time: endTime.trim(),
        hex_code: hexCode,
      }),
    });

    setIsAddingCourse(false);

    if (error) {
      Alert.alert(
        isEditing ? "Error Updating Course" : "Error Creating Course",
        error
      );
      return;
    }

    if (data) {
      const updatedSlot = mapApiToGridSlot(data);

      if (isEditing) {
        setScheduleItems((prev) =>
          prev.map((item) => (item.id === editingCourseId ? updatedSlot : item))
        );
      } else {
        setScheduleItems((prev) => [...prev, updatedSlot]);
      }

      closeAddCourseModal();
    }
  };



  const [alertConfig, setAlertConfig] = useState<AlertState>({
    visible: false,
    title: "",
    message: "",
  });

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText = "Delete"
  ) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type: "confirm",
      onConfirm,
      confirmText,
    });
  };

  const showAlert = (title: string, message?: string) => {
    setAlertConfig({ visible: true, title, message, type: "alert" });
  };

  const handleDeleteCourse = (courseId: string) => {
    showConfirm(
      "Delete Course",
      "Are you sure you want to delete this course from your schedule?",
      async () => {
        const previousItems = [...scheduleItems];
        setScheduleItems((prev) => prev.filter((item) => item.id !== courseId));

        const { error } = await apiRequest(`/courses/${courseId}/`, {
          method: "DELETE",
        });

        if (error) {
          showAlert("Delete Failed", error);
          setScheduleItems(previousItems);
        }
      },
      "Delete"
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <StatusBar style="light" />
      <CustomAlertModal
        state={alertConfig}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />

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
                <View style={{ width: totalGridWidth }}>
                  <View className="flex-row bg-brand-navy border-b border-brand-hair">
                    <View
                      style={{ width: timeColWidth }}
                      className="p-2 items-center justify-center border-r border-white/10"
                    >
                      <Feather name="clock" size={12} color="#C9A227" />
                    </View>

                    {DAYS.map((day) => (
                      <View
                        key={day}
                        style={{ width: dayColWidth }}
                        className="py-2.5 items-center justify-center border-r border-white/10"
                      >
                        <Text className="text-white text-xs font-black uppercase tracking-wider">
                          {day}
                        </Text>
                      </View>
                    ))}
                  </View>
                  
                  <View className="flex-row relative">
                    <View
                      style={{ width: timeColWidth }}
                      className="border-r border-brand-hair bg-brand-card/40"
                    >
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
                        style={{ width: dayColWidth }}
                        className="border-r border-brand-hair relative"
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
                backgroundColor: "rgba(20, 33, 61, 0.6)",
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

                      <View className="flex-row items-center gap-1.5">
                        <Pressable 
                          className="w-8 h-8 rounded-lg bg-white border border-brand-hair items-center justify-center active:bg-brand-hair"
                          onPress={() => handleOpenEditModal(item)}
                        >
                          <Feather name="edit-2" size={14} color="#14213D" />
                        </Pressable>
                        <Pressable
                          className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 items-center justify-center active:bg-red-100"
                          onPress={() => handleDeleteCourse(item.id)}
                        >
                          <Feather name="trash-2" size={14} color="#DC2626" />
                        </Pressable>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>

              <View className="p-4 border-t border-brand-hair bg-white">
                <Pressable
                  className="flex-row items-center justify-center gap-2 bg-brand-navy py-3 px-4 rounded-xl active:opacity-90"
                  onPress={() => setAddCourseModal(true)}
                >
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

      <Modal visible={addCourseModal} transparent animationType="fade" onRequestClose={closeAddCourseModal}>
        <View className="flex-1 justify-center items-center bg-brand-navy/60 px-6">
          <View className="w-full max-w-[360px] bg-white rounded-2xl p-5 border border-brand-hair">
            <Text className="text-brand-navy text-sm font-black uppercase tracking-widest mb-3">
              {editingCourseId ? "Edit Course" : "Add Course"}
            </Text>

            <Text className="text-brand-navy text-xs font-black mb-1">
              Course Name
            </Text>
            <TextInput
              className={`bg-brand-card border rounded-xl px-3.5 py-2.5 text-brand-navy text-xs font-medium ${
                errors.courseName ? "border-red-500" : "border-brand-hair"
              }`}
              placeholder="Schedule Title (e.g., CS 101)"
              placeholderTextColor="#A8ADB8"
              value={courseName}
              onChangeText={(text) => {
                setCourseName(text);
                if (errors.courseName) setErrors((prev) => ({ ...prev, courseName: undefined }));
              }}
              autoFocus
            />
            {errors.courseName && (
              <Text className="text-red-500 text-[10px] font-semibold mt-0.5 mb-2">
                {errors.courseName}
              </Text>
            )}

            <View className="relative z-20 mb-3">
              <Text className="text-brand-navy text-xs font-black mb-1">
                Color
              </Text>
              
              <Pressable
                className="bg-brand-card border border-brand-hair rounded-xl px-3.5 py-2.5 flex-row items-center justify-between active:bg-brand-hair/40"
                onPress={() => setIsColorDropdownOpen(!isColorDropdownOpen)}
              >
                <View className="flex-row items-center gap-2.5">
                  <View
                    style={{ backgroundColor: hexCode }}
                    className="w-4 h-4 rounded-full border border-black/10"
                  />
                  <Text className="text-brand-navy text-xs font-semibold uppercase">
                    {hexCode}
                  </Text>
                </View>

                <Feather
                  name={isColorDropdownOpen ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="#14213D"
                />
              </Pressable>
              
              {isColorDropdownOpen && (
                <View className="absolute top-[60px] left-0 right-0 bg-white border border-brand-hair rounded-xl shadow-lg p-3 z-50">
                  <View className="flex-row flex-wrap gap-2 justify-between">
                    {COURSE_COLORS.map((color) => {
                      const isSelected = hexCode === color;
                      return (
                        <Pressable
                          key={color}
                          style={{ backgroundColor: color }}
                          className={`w-7 h-7 rounded-lg items-center justify-center border ${
                            isSelected
                              ? "border-brand-navy scale-105 shadow-xs"
                              : "border-black/10 active:opacity-80"
                          }`}
                          onPress={() => {
                            setHexCode(color);
                            setIsColorDropdownOpen(false);
                          }}
                        >
                          {isSelected && (
                            <Feather name="check" size={14} color="#14213D" />
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            <Text className="text-brand-navy text-xs font-black mb-1">
              Days
            </Text>
            <View className="flex-row justify-between mb-3">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
                const isSelected = selectedDays.includes(day);
                return (
                  <Pressable
                    key={day}
                    onPress={() => {
                      toggleDay(day);
                      if (errors.selectedDays) setErrors((prev) => ({ ...prev, selectedDays: undefined }));
                    }}
                    className={`px-2.5 py-1.5 rounded-lg border ${
                      isSelected
                        ? "bg-brand-navy border-brand-navy"
                        : errors.selectedDays
                        ? "bg-brand-card border-red-500"
                        : "bg-brand-card border-brand-hair"
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-bold ${
                        isSelected ? "text-white" : "text-brand-slate"
                      }`}
                    >
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {errors.selectedDays && (
              <Text className="text-red-500 text-[10px] font-semibold mt-0.5 mb-2">
                {errors.selectedDays}
              </Text>
            )}

            <View className="flex-row gap-2 mt-3">
              <View className="flex-1">
                <Text className="text-brand-navy text-xs font-black mb-1">
                  Start Time
                </Text>
                <TextInput
                  className={`bg-brand-card border rounded-xl px-3.5 py-2 text-brand-navy text-xs font-medium ${
                    errors.startTime ? "border-red-500" : "border-brand-hair"
                  }`}
                  placeholder="08:00"
                  placeholderTextColor="#A8ADB8"
                  value={startTime}
                  onChangeText={(text) => {
                    setStartTime(text);
                    if (errors.startTime) setErrors((prev) => ({ ...prev, startTime: undefined }));
                  }}
                />
                {errors.startTime && (
                  <Text className="text-red-500 text-[10px] font-semibold mt-0.5">
                    {errors.startTime}
                  </Text>
                )}
              </View>

              <View className="flex-1">
                <Text className="text-brand-navy text-xs font-black mb-1">
                  End Time
                </Text>
                <TextInput
                  className={`bg-brand-card border rounded-xl px-3.5 py-2 text-brand-navy text-xs font-medium ${
                    errors.endTime ? "border-red-500" : "border-brand-hair"
                  }`}
                  placeholder="10:00"
                  placeholderTextColor="#A8ADB8"
                  value={endTime}
                  onChangeText={(text) => {
                    setEndTime(text);
                    if (errors.endTime) setErrors((prev) => ({ ...prev, endTime: undefined }));
                  }}
                />
                {errors.endTime && (
                  <Text className="text-red-500 text-[10px] font-semibold mt-0.5">
                    {errors.endTime}
                  </Text>
                )}
              </View>
            </View>

            <Text className="text-brand-navy text-xs font-black mb-1 mt-3">
              Room
            </Text>
            <TextInput
              className={`bg-brand-card border rounded-xl px-3.5 py-2.5 text-brand-navy text-xs font-medium ${
                errors.room ? "border-red-500" : "border-brand-hair"
              }`}
              placeholder="Room Name"
              placeholderTextColor="#A8ADB8"
              value={room}
              onChangeText={(text) => {
                setRoom(text);
                if (errors.room) setErrors((prev) => ({ ...prev, room: undefined }));
              }}
            />
            {errors.room && (
              <Text className="text-red-500 text-[10px] font-semibold mt-0.5">
                {errors.room}
              </Text>
            )}

            <View className="flex-row justify-end gap-2 mt-10">
              <Pressable
                className="px-4 py-2 rounded-full border border-brand-hair bg-white"
                onPress={closeAddCourseModal}
              >
                <Text className="text-brand-slate text-xs font-bold uppercase">Cancel</Text>
              </Pressable>

              <Pressable
                className="px-4 py-2 rounded-full bg-brand-gold active:opacity-90 min-w-[70px] items-center"
                onPress={handleSaveCourse}
                disabled={isAddingCourse}
              >
                {isAddingCourse ? (
                  <ActivityIndicator size="small" color="#14213D" />
                ) : (
                  <Text className="text-brand-navy text-xs font-black uppercase">
                    {editingCourseId ? "Save" : "Add"}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}