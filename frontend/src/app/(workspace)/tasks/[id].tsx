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

interface TaskItem {
  id: number;
  course: number;
  course_name?: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  is_completed: boolean;
}

interface CourseItem {
  id: number;
  name: string;
}

export default function Task() {
  const { id } = useLocalSearchParams<{ id: string }>(); 
  const router = useRouter();
  const { width } = useWindowDimensions();
  const wide = width >= 700;

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("ALL COURSES");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("all");
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (id) {
      fetchTasks(id);
    }
  }, [id]);

  const fetchTasks = async (classId: string) => {
    setLoading(true);

    const [coursesRes, tasksRes] = await Promise.all([
      apiRequest<CourseItem[]>(`/classes/${classId}/courses/`),
      apiRequest<TaskItem[]>(`/classes/${classId}/tasks/`),
    ]);

    if (coursesRes.error || tasksRes.error) {
      Alert.alert(
        "Error Loading Tasks",
        coursesRes.error || tasksRes.error || "Failed to load tasks and courses"
      );
    } else {
      if (coursesRes.data) setCourses(coursesRes.data);
      if (tasksRes.data) setTasks(tasksRes.data);
    }

    setLoading(false);
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesCourse =
      selectedCourse === "ALL COURSES" || t.course_name === selectedCourse;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" && !t.is_completed) ||
      (statusFilter === "completed" && t.is_completed);

    return matchesCourse && matchesStatus;
  });

  const getPriorityBadge = (priority: TaskItem["priority"]) => {
    switch (priority) {
      case "high":
        return { bg: "bg-brand-crimson/10", text: "text-brand-crimson", label: "High" };
      case "medium":
        return { bg: "bg-brand-gold/15", text: "text-brand-navy", label: "Med" };
      case "low":
      default:
        return { bg: "bg-gray-100", text: "text-brand-slate", label: "Low" };
    }
  };

  const courseOptions = ["ALL COURSES", ...courses.map((c) => c.name)];

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
            </View>

            <Text className="text-white text-xl font-black uppercase tracking-wide text-center">
              Tasks
            </Text>
          </View>
        </View>

        <View className="items-center py-6">
          <View style={{ width: "100%", maxWidth: width, paddingHorizontal: wide ? 32 : 24 }}>
            <View className="z-10 mb-4">
              <View className="flex-row items-center justify-between gap-2">
                <View className="relative flex-1">
                  <Pressable
                    className="flex-row items-center justify-between bg-brand-card border border-brand-hair px-3 py-2 rounded-xl active:bg-brand-hair/20"
                    onPress={() => setDropdownOpen((prev) => !prev)}
                  >
                    <View className="flex-row items-center gap-1.5 flex-1 pr-1">
                      <Feather name="book-open" size={12} color="#14213D" />
                      <Text
                        className="text-xs font-bold text-brand-navy tracking-tight"
                        numberOfLines={1}
                      >
                        {selectedCourse}
                      </Text>
                    </View>
                    <Feather
                      name={dropdownOpen ? "chevron-up" : "chevron-down"}
                      size={14}
                      color="#5B6472"
                    />
                  </Pressable>

                  {dropdownOpen && (
                    <View className="absolute top-11 left-0 right-0 bg-white border border-brand-hair rounded-xl shadow-lg z-50 overflow-hidden py-1">
                      {courseOptions.map((course) => {
                        const isSelected = selectedCourse === course;
                        return (
                          <Pressable
                            key={course}
                            className={`px-3 py-2 flex-row items-center justify-between active:bg-brand-card ${
                              isSelected ? "bg-brand-card" : ""
                            }`}
                            onPress={() => {
                              setSelectedCourse(course);
                              setDropdownOpen(false);
                            }}
                          >
                            <Text
                              className={`text-xs ${
                                isSelected
                                  ? "font-black text-brand-navy"
                                  : "font-medium text-brand-slate"
                              }`}
                            >
                              {course}
                            </Text>
                            {isSelected && (
                              <Feather name="check" size={12} color="#14213D" />
                            )}
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>

                <View className="flex-row gap-1">
                  {(["all", "pending", "completed"] as const).map((type) => {
                    const active = statusFilter === type;
                    return (
                      <Pressable
                        key={type}
                        onPress={() => setStatusFilter(type)}
                        className={`px-2.5 py-2 rounded-xl border ${
                          active
                            ? "bg-brand-navy border-brand-navy"
                            : "bg-white border-brand-hair"
                        }`}
                      >
                        <Text
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            active ? "text-white" : "text-brand-slate"
                          }`}
                        >
                          {type}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            <View className="items-center mb-4">
              <Text className="text-brand-navy text-[11px] font-black uppercase tracking-widest mb-1">
                Tasks ({filteredTasks.length})
              </Text>
              <View className="w-8 h-0.5 bg-brand-gold rounded-full" />
            </View>

            {loading ? (
              <View className="py-12 items-center justify-center">
                <ActivityIndicator size="large" color="#14213D" />
                <Text className="text-brand-slate text-xs mt-3 font-bold">
                  Fetching tasks...
                </Text>
              </View>
            ) : filteredTasks.length === 0 ? (
              <View className="py-8 items-center justify-center rounded-2xl bg-brand-card border border-brand-hair p-4">
                <Feather name="check-circle" size={20} color="#C9A227" />
                <Text className="text-brand-navy text-xs font-bold mt-2">No Tasks Found</Text>
                <Text className="text-brand-slate text-[11px] text-center mt-0.5">
                  Try switching filters or courses.
                </Text>
              </View>
            ) : (
              <View className="gap-2.5">
                {filteredTasks.map((item) => {
                  const badge = getPriorityBadge(item.priority);

                  return (
                    <View
                      key={item.id}
                      className="rounded-2xl bg-brand-card border border-brand-hair p-3 shadow-2xs"
                    >
                      <View className="flex-row items-center justify-between mb-2">
                        <View className="bg-brand-navy/10 px-2 py-0.5 rounded border border-brand-navy/10">
                          <Text className="text-[10px] font-bold text-brand-navy">
                            {item.course_name ?? "Course"}
                          </Text>
                        </View>

                        <View className={`px-2 py-0.5 rounded-full ${badge.bg}`}>
                          <Text
                            className={`text-[9px] font-black uppercase tracking-wider ${badge.text}`}
                          >
                            {badge.label}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row items-start justify-between gap-2.5">
                        <Pressable
                          className="flex-row items-start gap-2.5 flex-1"
                          hitSlop={4}
                        >
                          <View
                            className={`w-4 h-4 rounded border items-center justify-center mt-0.5 ${
                              item.is_completed
                                ? "bg-brand-navy border-brand-navy"
                                : "border-brand-slate/40 bg-white"
                            }`}
                          >
                            {item.is_completed && (
                              <Feather name="check" size={10} color="#FFFFFF" />
                            )}
                          </View>

                          <View className="flex-1">
                            <Text
                              className={`text-xs font-bold leading-snug ${
                                item.is_completed
                                  ? "text-brand-slate/50 line-through"
                                  : "text-brand-navy"
                              }`}
                            >
                              {item.title}
                            </Text>

                            {item.description ? (
                              <Text
                                className={`text-[11px] leading-relaxed mt-1 ${
                                  item.is_completed
                                    ? "text-brand-slate/30"
                                    : "text-brand-slate"
                                }`}
                              >
                                {item.description}
                              </Text>
                            ) : null}
                          </View>
                        </Pressable>

                        <Pressable
                          className="p-1 rounded-md active:bg-brand-crimson/10 self-start"
                          hitSlop={6}
                        >
                          <Feather name="trash-2" size={13} color="#8B1E3F" />
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}