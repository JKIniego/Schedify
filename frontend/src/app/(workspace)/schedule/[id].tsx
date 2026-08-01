import { useState, useRef, useEffect, useMemo } from "react";
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
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import ViewShot, { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { apiRequest } from "../../../utils/api";
import { CustomAlertModal, AlertState } from "../../../utils/alert";

type DayType = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

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
  days: DayType[];
  startHour: number;
  durationHours: number;
  timeDisplay: string;
  bgColor: string;
  rawStartTime: string;
  rawEndTime: string;
}

const WEEKDAYS: DayType[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const ALL_DAYS: DayType[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DEFAULT_START_HOUR = 8;
const DEFAULT_END_HOUR = 16;

const BASE_ROW_HEIGHT = 60;

const formatHourLabel = (hourDecimal: number): string => {
  const h = Math.floor(hourDecimal);
  const period = h >= 12 ? "PM" : "AM";
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour}:00 ${period}`;
};

const COURSE_COLORS = [
  "#FAF1F1", "#FAF5F1", "#FAF9F1", "#F2FAF4", "#F1F6FA", "#F5F1FA", "#FAF1F6",
  "#F5C7C7", "#F5DDD7", "#F5F2C7", "#CEF5D6", "#C7E0F5", "#E0C7F5", "#F5C7DF",
  "#F2A8A8", "#F2CDA8", "#F2ECA8", "#A8F2B9", "#A8CFF2", "#CFA8F2", "#F2A8CD",
  "#EE8B8B", "#EEBD8B", "#EEE58B", "#8BEEA3", "#8BBEEE", "#BE8BEE", "#EE8BBD",
  "#EA7070", "#EAAD70", "#EADE70", "#70EA8D", "#70ADEA", "#AD70EA", "#EA70AD",
];

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

const timeStringToDate = (timeStr: string): Date => {
  const date = new Date();
  if (!timeStr) {
    date.setHours(8, 0, 0, 0);
    return date;
  }
  const [hours, minutes] = timeStr.split(":").map(Number);
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
};

const dateToHHMM = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

const parseDays = (days: CourseAPIResponse["days"]): DayType[] => {
  if (Array.isArray(days)) {
    return days as DayType[];
  }
  if (typeof days === "string") {
    return days.split(",").map((d) => d.trim()) as DayType[];
  }
  return [];
};

const mapApiToGridSlot = (course: CourseAPIResponse): GridSlot => {
  const startDecimal = parseTimeToDecimal(course.start_time);
  const endDecimal = parseTimeToDecimal(course.end_time);
  const duration = Math.max(endDecimal - startDecimal, 0.25);

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

  const [scheduleItems, setScheduleItems] = useState<GridSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const viewShotRef = useRef<any>(null);

  const { rowHeight, pixelsPerHour } = useMemo(() => {
    if (scheduleItems.length === 0) {
      return { rowHeight: BASE_ROW_HEIGHT, pixelsPerHour: BASE_ROW_HEIGHT };
    }

    const minDurationHours = Math.min(
      ...scheduleItems.map((item) => item.durationHours)
    );

    if (minDurationHours < 1) {
      const pixelsPerHour = BASE_ROW_HEIGHT / Math.max(minDurationHours, 0.25);

      return {
        rowHeight: pixelsPerHour,
        pixelsPerHour: pixelsPerHour,
      };
    }

    return {
      rowHeight: BASE_ROW_HEIGHT,
      pixelsPerHour: BASE_ROW_HEIGHT,
    };
  }, [scheduleItems]);

  const activeDays = useMemo<DayType[]>(() => {
    const hasSat = scheduleItems.some((item) => item.days.includes("Sat"));
    const hasSun = scheduleItems.some((item) => item.days.includes("Sun"));

    const days: DayType[] = [...WEEKDAYS];
    if (hasSat) days.push("Sat");
    if (hasSun) days.push("Sun");
    return days;
  }, [scheduleItems]);

  const horizontalPadding = wide ? 64 : 48;
  const availableWidth = width - horizontalPadding;
  const timeColWidth = Math.max(54, Math.floor(availableWidth * 0.12));
  const minDayColWidth = 95;
  const calculatedDayColWidth = Math.floor(
    (availableWidth - timeColWidth) / activeDays.length
  );
  const dayColWidth = Math.max(minDayColWidth, calculatedDayColWidth);
  const totalGridWidth = timeColWidth + dayColWidth * activeDays.length;

  const [drawerVisible, setDrawerVisible] = useState(false);
  const drawerWidth = Math.min(width * 0.85, 320);
  const slideAnim = useRef(new Animated.Value(drawerWidth)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const webTimeInputRef = useRef<HTMLInputElement | null>(null);

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
  const [startTime, setStartTime] = useState<string>("08:00");
  const [endTime, setEndTime] = useState<string>("10:00");
  const [showPickerMode, setShowPickerMode] = useState<"start" | "end" | null>(null);
  const [hexCode, setHexCode] = useState<string>("#A5D6A7");
  const [isAddingCourse, setIsAddingCourse] = useState<boolean>(false);
  const [errors, setErrors] = useState<{
    courseName?: string;
    room?: string;
    selectedDays?: string;
    startTime?: string;
    endTime?: string;
    conflict?: string;
  }>({});

  const closeAddCourseModal = () => {
    setAddCourseModal(false);
    setEditingCourseId(null);
    setCourseName("");
    setRoom("");
    setSelectedDays([]);
    setStartTime("08:00");
    setEndTime("10:00");
    setShowPickerMode(null);
    setHexCode("#A5D6A7");
    setIsColorDropdownOpen(false);
    setErrors({});
  };

  const handleOpenEditModal = (item: GridSlot) => {
    setEditingCourseId(item.id);
    setCourseName(item.title);
    setRoom(item.room === "N/A" ? "" : item.room);
    setSelectedDays(item.days);
    setStartTime(item.rawStartTime || "08:00");
    setEndTime(item.rawEndTime || "10:00");
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
    if (!startTime) {
      newErrors.startTime = "Start time is required.";
    }
    if (!endTime) {
      newErrors.endTime = "End time is required.";
    }

    const newStartDecimal = parseTimeToDecimal(startTime);
    const newEndDecimal = parseTimeToDecimal(endTime);

    if (startTime && endTime && newStartDecimal >= newEndDecimal) {
      newErrors.endTime = "End time must be after start time.";
    }

    if (!newErrors.startTime && !newErrors.endTime && selectedDays.length > 0) {
      const conflictingCourse = scheduleItems.find((item) => {
        if (editingCourseId && item.id === editingCourseId) return false;

        const hasSharedDay = item.days.some((day) => selectedDays.includes(day));
        if (!hasSharedDay) return false;

        const existingStart = item.startHour;
        const existingEnd = item.startHour + item.durationHours;

        return newStartDecimal < existingEnd && existingStart < newEndDecimal;
      });

      if (conflictingCourse) {
        newErrors.conflict = `Schedule conflict with "${conflictingCourse.title}" (${conflictingCourse.timeDisplay}).`;
      }
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

  const { minHour, dynamicHours } = useMemo(() => {
    let min = DEFAULT_START_HOUR;
    let max = DEFAULT_END_HOUR;

    scheduleItems.forEach((item) => {
      const start = Math.floor(item.startHour);
      const end = Math.ceil(item.startHour + item.durationHours);
      if (start < min) min = start;
      if (end > max) max = end;
    });

    if (addCourseModal) {
      if (startTime) {
        const modalStart = Math.floor(parseTimeToDecimal(startTime));
        if (modalStart < min) min = modalStart;
        if (modalStart > max) max = modalStart;
      }
      if (endTime) {
        const modalEnd = Math.ceil(parseTimeToDecimal(endTime));
        if (modalEnd < min) min = modalEnd;
        if (modalEnd > max) max = modalEnd;
      }
    }

    const hours = [];
    for (let h = min; h <= max; h++) {
      hours.push(h);
    }

    return { minHour: min, maxHour: max, dynamicHours: hours };
  }, [scheduleItems, addCourseModal, startTime, endTime]);

  const handleExportImage = async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      const isWeb = Platform.OS === "web";
      
      const result = await captureRef(viewShotRef, {
        format: "png",
        quality: 1.0,
        result: isWeb ? "data-uri" : "tmpfile",
      });
      
      if (isWeb) {
        const link = document.createElement("a");
        link.href = result;
        link.download = "schedule.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(result, {
          mimeType: "image/png",
          dialogTitle: "Export Schedule Table",
          UTI: "public.png",
        });
      } else {
        showAlert("Sharing Unavailable", "Sharing is not supported on this device.");
      }
    } catch (err: any) {
      showAlert("Export Failed", err.message || "An error occurred while generating image.");
    } finally {
      setIsExporting(false);
    }
  };

  const gridContentHeight = dynamicHours.length * rowHeight;

  const renderGridContent = () => (
    <View style={{ width: totalGridWidth }}>
      <View className="flex-row bg-brand-navy border-b border-brand-hair z-10">
        <View
          style={{ width: timeColWidth }}
          className="p-2 items-center justify-center border-r border-white/10"
        >
          <Feather name="clock" size={12} color="#C9A227" />
        </View>

        {activeDays.map((day) => (
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

      <View className="flex-row relative" style={{ height: gridContentHeight }}>
        <View
          style={{ width: timeColWidth }}
          className="border-r border-brand-hair bg-brand-card/40"
        >
          {dynamicHours.map((hour) => (
            <View
              key={hour}
              style={{ height: rowHeight }}
              className="border-b border-brand-hair/60 justify-start pt-1 items-center"
            >
              <Text className="text-[10px] text-brand-slate font-bold">
                {formatHourLabel(hour)}
              </Text>
            </View>
          ))}
        </View>

        {activeDays.map((day) => (
          <View
            key={day}
            style={{ width: dayColWidth }}
            className="border-r border-brand-hair relative"
          >
            {dynamicHours.map((hour) => (
              <View
                key={hour}
                style={{ height: rowHeight }}
                className="border-b border-brand-hair/30"
              />
            ))}

            {scheduleItems
              .filter((item) => item.days.includes(day as any))
              .map((item) => {
                const topOffset = (item.startHour - minHour) * pixelsPerHour;
                const blockHeight = item.durationHours * pixelsPerHour;
                const isShortBlock = blockHeight < 36;

                return (
                  <Pressable
                    key={`${item.id}-${day}`}
                    style={{
                      position: "absolute",
                      top: topOffset + 1,
                      left: 1,
                      right: 1,
                      height: Math.max(blockHeight - 2, 20),
                      backgroundColor: item.bgColor,
                    }}
                    className={`border border-black/10 rounded-md overflow-hidden ${
                      isShortBlock ? "px-1 py-0.5 justify-center" : "p-1.5 justify-between"
                    } shadow-xs active:opacity-90`}
                  >
                    <View className="flex-shrink">
                      <Text
                        className="text-[10px] font-black tracking-tight leading-none text-black"
                        numberOfLines={1}
                      >
                        {item.code}
                      </Text>
                      {!isShortBlock && (
                        <Text
                          className="text-[8px] text-black/80 font-semibold mt-0.5 leading-none"
                          numberOfLines={1}
                        >
                          {item.timeDisplay}
                        </Text>
                      )}
                    </View>

                    {!isShortBlock && item.room && item.room !== "N/A" && (
                      <View className="flex-row items-center gap-0.5">
                        <Feather name="map-pin" size={7} color="#000000" />
                        <Text
                          className="text-[8px] text-black font-extrabold uppercase leading-none"
                          numberOfLines={1}
                        >
                          {item.room}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
          </View>
        ))}
      </View>
    </View>
  );

  const renderExportGridContent = () => (
    <View style={{ width: totalGridWidth }}>
      <View style={{ flexDirection: "row", backgroundColor: "#14213D", borderBottomWidth: 1, borderColor: "#E5E7EB" }}>
        <View
          style={{
            width: timeColWidth,
            padding: 8,
            alignItems: "center",
            justifyContent: "center",
            borderRightWidth: 1,
            borderColor: "rgba(255,255,255,0.1)",
          }}
        >
          <Text style={{ fontSize: 10, color: "#C9A227" }}>🕒</Text>
        </View>

        {activeDays.map((day) => (
          <View
            key={day}
            style={{
              width: dayColWidth,
              paddingVertical: 10,
              alignItems: "center",
              justifyContent: "center",
              borderRightWidth: 1,
              borderColor: "rgba(255,255,255,0.1)",
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 11,
                fontWeight: "900",
                textTransform: "uppercase",
                lineHeight: 14,
                ...(Platform.OS === "web" ? { display: "block" as any } : {}),
              }}
            >
              {day}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: "row", position: "relative", height: gridContentHeight }}>
        <View
          style={{
            width: timeColWidth,
            borderRightWidth: 1,
            borderColor: "#E5E7EB",
            backgroundColor: "rgba(244, 245, 247, 0.4)",
          }}
        >
          {dynamicHours.map((hour) => (
            <View
              key={hour}
              style={{
                height: rowHeight,
                borderBottomWidth: 1,
                borderColor: "rgba(229, 231, 235, 0.6)",
                justifyContent: "flex-start",
                paddingTop: 4,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  color: "#6B7280",
                  fontWeight: "700",
                  lineHeight: 12,
                  ...(Platform.OS === "web" ? { display: "block" as any } : {}),
                }}
              >
                {formatHourLabel(hour)}
              </Text>
            </View>
          ))}
        </View>

        {activeDays.map((day) => (
          <View
            key={day}
            style={{ width: dayColWidth, borderRightWidth: 1, borderColor: "#E5E7EB", position: "relative" }}
          >
            {dynamicHours.map((hour) => (
              <View
                key={hour}
                style={{ height: rowHeight, borderBottomWidth: 1, borderColor: "rgba(229, 231, 235, 0.3)" }}
              />
            ))}

            {scheduleItems
              .filter((item) => item.days.includes(day as any))
              .map((item) => {
                const topOffset = (item.startHour - minHour) * pixelsPerHour;
                const blockHeight = item.durationHours * pixelsPerHour;
                const isShortBlock = blockHeight < 36;

                return (
                  <View
                    key={`export-${item.id}-${day}`}
                    style={{
                      position: "absolute",
                      top: topOffset + 1,
                      left: 1,
                      right: 1,
                      height: Math.max(blockHeight - 2, 20),
                      backgroundColor: item.bgColor,
                      borderWidth: 1,
                      borderColor: "rgba(0,0,0,0.1)",
                      borderRadius: 6,
                      padding: isShortBlock ? 2 : 6,
                      justifyContent: isShortBlock ? "center" : "space-between",
                    }}
                  >
                    <View>
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "900",
                          color: "#000000",
                          lineHeight: 13,
                          height: 13,
                          ...(Platform.OS === "web" ? { display: "block" as any } : {}),
                        }}
                      >
                        {item.code}
                      </Text>
                      {!isShortBlock && (
                        <Text
                          style={{
                            fontSize: 8,
                            fontWeight: "600",
                            color: "rgba(0,0,0,0.8)",
                            marginTop: 2,
                            lineHeight: 10,
                            height: 10,
                            ...(Platform.OS === "web" ? { display: "block" as any } : {}),
                          }}
                        >
                          {item.timeDisplay}
                        </Text>
                      )}
                    </View>

                    {!isShortBlock && item.room && item.room !== "N/A" && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                        <Text style={{ fontSize: 7, lineHeight: 9 }}>📍</Text>
                        <Text
                          style={{
                            fontSize: 8,
                            fontWeight: "800",
                            color: "#000000",
                            textTransform: "uppercase",
                            lineHeight: 10,
                            height: 10,
                            ...(Platform.OS === "web" ? { display: "block" as any } : {}),
                          }}
                        >
                          {item.room}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <StatusBar style="light" />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
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
              <View className="rounded-2xl border border-brand-hair bg-white shadow-xs mb-6 overflow-hidden">
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={true}
                  nestedScrollEnabled={true}
                >
                  <ScrollView
                    style={{ maxHeight: 600 }}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={true}
                  >
                    {renderGridContent()}
                  </ScrollView>
                </ScrollView>
              </View>
            )}

            <Pressable
              className="flex-row items-center justify-center gap-2 bg-brand-gold py-3.5 px-6 rounded-2xl active:opacity-90 shadow-xs"
              onPress={handleExportImage}
              disabled={isExporting || loading}
            >
              {isExporting ? (
                <ActivityIndicator size="small" color="#14213D" />
              ) : (
                <>
                  <Feather name="image" size={16} color="#14213D" />
                  <Text className="text-brand-navy text-xs font-black uppercase tracking-wider">
                    Export Schedule as PNG
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {!loading && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: 0,
            width: 0,
            overflow: "hidden",
          }}
          pointerEvents="none"
        >
          <ViewShot
            ref={viewShotRef}
            options={{ format: "png", quality: 1.0 }}
            style={{
              backgroundColor: "#FFFFFF",
              padding: 24,
              width: totalGridWidth + 48,
            }}
          >
            <View style={{ marginBottom: 16, alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "900",
                  color: "#14213D",
                  lineHeight: 22,
                  height: 22,
                  ...(Platform.OS === "web" ? { display: "block" as any } : {}),
                }}
              >
                SCHEDIFY
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: "#14213D",
                  marginTop: 4,
                  lineHeight: 18,
                  height: 18,
                  ...(Platform.OS === "web" ? { display: "block" as any } : {}),
                }}
              >
                1st Sem 2026 Schedule
              </Text>
            </View>

            <View style={{ borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", overflow: "hidden" }}>
              {renderExportGridContent()}
            </View>
          </ViewShot>
        </View>
      )}

      <Modal
        visible={drawerVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeDrawer}
      >
        <CustomAlertModal
          state={alertConfig}
          onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
        />

        <Modal visible={addCourseModal} transparent animationType="fade" onRequestClose={closeAddCourseModal}>
          <View className="flex-1 justify-center items-center bg-brand-navy/60 px-6">
            <View className="w-full max-w-[360px] bg-white rounded-2xl p-5 border border-brand-hair">
              <Text className="text-brand-navy text-sm font-black uppercase tracking-widest mb-3">
                {editingCourseId ? "Edit Course" : "Add Course"}
              </Text>

              {errors.conflict && (
                <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3 flex-row items-center gap-2">
                  <Feather name="alert-circle" size={16} color="#DC2626" />
                  <Text className="text-red-600 text-xs font-medium flex-1">
                    {errors.conflict}
                  </Text>
                </View>
              )}

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
                  if (errors.courseName || errors.conflict) {
                    setErrors((prev) => ({ ...prev, courseName: undefined, conflict: undefined }));
                  }
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
                {ALL_DAYS.map((day) => {
                  const isSelected = selectedDays.includes(day);
                  return (
                    <Pressable
                      key={day}
                      onPress={() => {
                        toggleDay(day);
                        if (errors.selectedDays || errors.conflict) {
                          setErrors((prev) => ({ ...prev, selectedDays: undefined, conflict: undefined }));
                        }
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
                  <Pressable
                    className={`bg-brand-card border rounded-xl px-3.5 py-2 flex-row items-center justify-between ${
                      errors.startTime ? "border-red-500" : "border-brand-hair"
                    }`}
                    onPress={() => {
                      setIsColorDropdownOpen(false);
                      setShowPickerMode("start");
                      if (Platform.OS === "web") {
                        setTimeout(() => webTimeInputRef.current?.showPicker?.(), 50);
                      }
                    }}
                  >
                    <Text className="text-brand-navy text-xs font-bold">
                      {formatTimeDisplay(startTime, startTime).split("-")[0] || "08:00 AM"}
                    </Text>
                    <Feather name="clock" size={14} color="#14213D" />
                  </Pressable>
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
                  <Pressable
                    className={`bg-brand-card border rounded-xl px-3.5 py-2 flex-row items-center justify-between ${
                      errors.endTime ? "border-red-500" : "border-brand-hair"
                    }`}
                    onPress={() => {
                      setIsColorDropdownOpen(false);
                      setShowPickerMode("end");
                      if (Platform.OS === "web") {
                        setTimeout(() => webTimeInputRef.current?.showPicker?.(), 50);
                      }
                    }}
                  >
                    <Text className="text-brand-navy text-xs font-bold">
                      {formatTimeDisplay(endTime, endTime).split("-")[0] || "10:00 AM"}
                    </Text>
                    <Feather name="clock" size={14} color="#14213D" />
                  </Pressable>
                  {errors.endTime && (
                    <Text className="text-red-500 text-[10px] font-semibold mt-0.5">
                      {errors.endTime}
                    </Text>
                  )}
                </View>
              </View>

              {showPickerMode && (
                Platform.OS === "web" ? (
                  <input
                    ref={webTimeInputRef}
                    type="time"
                    value={showPickerMode === "start" ? startTime : endTime}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        if (showPickerMode === "start") {
                          setStartTime(val);
                          if (errors.startTime || errors.conflict) {
                            setErrors((prev) => ({ ...prev, startTime: undefined, conflict: undefined }));
                          }
                        } else {
                          setEndTime(val);
                          if (errors.endTime || errors.conflict) {
                            setErrors((prev) => ({ ...prev, endTime: undefined, conflict: undefined }));
                          }
                        }
                      }
                      setShowPickerMode(null);
                    }}
                    style={{
                      position: "absolute",
                      opacity: 0,
                      pointerEvents: "none",
                      width: 0,
                      height: 0,
                    }}
                  />
                ) : (
                  <DateTimePicker
                    value={timeStringToDate(
                      showPickerMode === "start" ? startTime : endTime
                    )}
                    mode="time"
                    is24Hour={false}
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(event, selectedDate) => {
                      setShowPickerMode(null);
                      if (event.type === "set" && selectedDate) {
                        const formattedHHMM = dateToHHMM(selectedDate);
                        if (showPickerMode === "start") {
                          setStartTime(formattedHHMM);
                          if (errors.startTime || errors.conflict) {
                            setErrors((prev) => ({ ...prev, startTime: undefined, conflict: undefined }));
                          }
                        } else {
                          setEndTime(formattedHHMM);
                          if (errors.endTime || errors.conflict) {
                            setErrors((prev) => ({ ...prev, endTime: undefined, conflict: undefined }));
                          }
                        }
                      }
                    }}
                  />
                )
              )}

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
    </SafeAreaView>
  );
}