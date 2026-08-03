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
  deadline?: string | null;
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
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed" | "overdue">("all");
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (selectedTask) {
      fadeAnim.setValue(0);
      slideAnim.setValue(300);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [selectedTask, fadeAnim, slideAnim]);

  const closeTaskModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSelectedTask(null);
    });
  };

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
  
  const isPastDeadline = (deadline?: string | null) => {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) return false;
    return new Date() > deadlineDate;
  };
  
  const taskCounts = useMemo(() => {
    const courseFiltered = tasks.filter(
      (t) => selectedCourse === "ALL COURSES" || t.course_name === selectedCourse
    );
    return {
      all: courseFiltered.length,
      pending: courseFiltered.filter((t) => !t.is_completed).length,
      completed: courseFiltered.filter((t) => t.is_completed).length,
      overdue: courseFiltered.filter((t) => isPastDeadline(t.deadline)).length,
    };
  }, [tasks, selectedCourse]);

  const filteredTasks = tasks.filter((t) => {
    const matchesCourse =
      selectedCourse === "ALL COURSES" || t.course_name === selectedCourse;

    const isOverdue = isPastDeadline(t.deadline);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" && !t.is_completed) ||
      (statusFilter === "completed" && t.is_completed) ||
      (statusFilter === "overdue" && isOverdue);

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
  
  const getTaskCardStyles = (task: TaskItem) => {
    const pastDeadline = isPastDeadline(task.deadline);
    
    if (pastDeadline) {
      if (!task.is_completed) {
        return {
          cardBg: "bg-red-50 border-red-200",
          isOverdue: true,
          overdueBadgeBg: "bg-red-100",
          overdueBadgeText: "text-red-700",
        };
      } else {
        return {
          cardBg: "bg-emerald-50 border-emerald-200",
          isOverdue: true,
          overdueBadgeBg: "bg-red-100",
          overdueBadgeText: "text-red-700",
        };
      }
    }
    
    if (task.is_completed) {
      return {
        cardBg: "bg-emerald-50 border-emerald-200",
        isOverdue: false,
      };
    }
    
    return {
      cardBg: "bg-brand-card border-brand-hair",
      isOverdue: false,
    };
  };

  const formatDeadline = (dateString?: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;

    return date
      .toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .replace(",", "");
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
            <View className="z-30 mb-6 gap-3" style={{ zIndex: 30 }}>
              <View className="relative z-40" style={{ zIndex: 40 }}>
                <Pressable
                  className={`flex-row items-center justify-between bg-white border px-3.5 py-2.5 rounded-xl shadow-2xs active:bg-slate-50 ${
                    dropdownOpen ? "border-brand-navy ring-1 ring-brand-navy/20" : "border-brand-hair"
                  }`}
                  onPress={() => setDropdownOpen((prev) => !prev)}
                >
                  <View className="flex-row items-center gap-2 flex-1 pr-2">
                    <View className="w-6 h-6 rounded-md bg-brand-navy/5 items-center justify-center">
                      <Feather name="book-open" size={12} color="#14213D" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[9px] font-bold text-brand-slate uppercase tracking-wider">
                        Filter by Course
                      </Text>
                      <Text
                        className="text-xs font-black text-brand-navy tracking-tight"
                        numberOfLines={1}
                      >
                        {selectedCourse}
                      </Text>
                    </View>
                  </View>
                  <Feather
                    name={dropdownOpen ? "chevron-up" : "chevron-down"}
                    size={16}
                    color="#5B6472"
                  />
                </Pressable>
                
                {dropdownOpen && (
                  <View 
                    className="absolute top-14 left-0 right-0 bg-white border border-brand-hair rounded-2xl shadow-xl z-50 overflow-hidden py-1"
                    style={{ zIndex: 50, elevation: 10 }}
                  >
                    <ScrollView 
                      nestedScrollEnabled 
                      style={{ maxHeight: 200 }} 
                      showsVerticalScrollIndicator={false}
                    >
                      {courseOptions.map((course) => {
                        const isSelected = selectedCourse === course;
                        return (
                          <Pressable
                            key={course}
                            className={`px-4 py-2.5 flex-row items-center justify-between active:bg-brand-card ${
                              isSelected ? "bg-brand-navy/5" : ""
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
                              <Feather name="check" size={14} color="#14213D" />
                            )}
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
              </View>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 6 }}
                className="flex-row z-10"
                style={{ zIndex: 10 }}
              >
                {(["all", "pending", "completed", "overdue"] as const).map((type) => {
                  const active = statusFilter === type;
                  const count = taskCounts[type];

                  return (
                    <Pressable
                      key={type}
                      onPress={() => setStatusFilter(type)}
                      className={`px-3 py-1.5 rounded-full flex-row items-center gap-1.5 border transition-all ${
                        active
                          ? type === "overdue"
                            ? "bg-red-700 border-red-700"
                            : "bg-brand-navy border-brand-navy"
                          : "bg-white border-brand-hair active:bg-slate-50"
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          active ? "text-white" : "text-brand-slate"
                        }`}
                      >
                        {type}
                      </Text>
                      
                      <View
                        className={`px-1.5 py-0.2 rounded-full ${
                          active
                            ? "bg-white/20"
                            : type === "overdue" && count > 0
                            ? "bg-red-100"
                            : "bg-slate-100"
                        }`}
                      >
                        <Text
                          className={`text-[9px] font-black ${
                            active
                              ? "text-white"
                              : type === "overdue" && count > 0
                              ? "text-red-700"
                              : "text-brand-navy"
                          }`}
                        >
                          {count}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
            
            <View className="items-center mb-4 z-0" style={{ zIndex: 0 }}>
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
              <View className="flex-row flex-wrap justify-between gap-y-2.5 z-0" style={{ zIndex: 0 }}>
                {filteredTasks.map((item) => {
                  const formattedDeadline = formatDeadline(item.deadline);
                  const cardStyles = getTaskCardStyles(item);

                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => setSelectedTask(item)}
                      className={`w-[48.5%] rounded-2xl border p-3 shadow-2xs flex-col justify-between ${cardStyles.cardBg}`}
                    >
                      <View className="flex-row items-center justify-between mb-2">
                        <View className="bg-brand-navy/10 px-2 py-0.5 rounded border border-brand-navy/10 shrink">
                          <Text 
                            className="text-[10px] font-bold text-brand-navy"
                            numberOfLines={1}
                          >
                            {item.course_name ?? "Course"}
                          </Text>
                        </View>

                        {cardStyles.isOverdue && (
                          <View className={`px-1.5 py-0.5 rounded-full ${cardStyles.overdueBadgeBg}`}>
                            <Text className={`text-[8px] font-black uppercase tracking-wider ${cardStyles.overdueBadgeText}`}>
                              Overdue
                            </Text>
                          </View>
                        )}
                      </View>
                      
                      <Text
                        className={`text-xs font-bold leading-snug my-1 ${
                          item.is_completed
                            ? "text-brand-slate/50 line-through"
                            : "text-brand-navy"
                        }`}
                        numberOfLines={2}
                      >
                        {item.title}
                      </Text>
                      
                      {formattedDeadline ? (
                        <View className="flex-row items-center gap-1 mt-2">
                          <Feather
                            name="calendar"
                            size={11}
                            color={
                              cardStyles.isOverdue && !item.is_completed
                                ? "#B91C1C"
                                : item.is_completed
                                ? "#A8ADB8"
                                : "#8B1E3F"
                            }
                          />
                          <Text
                            className={`text-[10px] font-bold ${
                              cardStyles.isOverdue && !item.is_completed
                                ? "text-red-700"
                                : item.is_completed
                                ? "text-brand-slate/40 line-through"
                                : "text-brand-crimson"
                            }`}
                          >
                            Due: {formattedDeadline}
                          </Text>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      
      <Modal
        visible={!!selectedTask}
        animationType="none"
        transparent={true}
        onRequestClose={closeTaskModal}
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
            <Pressable style={StyleSheet.absoluteFillObject} onPress={closeTaskModal} />
          </Animated.View>
          
          {selectedTask && (() => {
            const isTaskOverdue = isPastDeadline(selectedTask.deadline);

            return (
              <Animated.View
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "#FFFFFF",
                  padding: 24,
                  transform: [{ translateY: slideAnim }],
                }}
                className="rounded-t-3xl shadow-2xl max-h-[80%]"
              >
                <View className="items-center mb-4">
                  <View className="w-12 h-1.5 bg-slate-200 rounded-full" />
                </View>
                
                <View className="flex-row items-start justify-between mb-4">
                  <View className="flex-1 pr-3">
                    <View className="flex-row items-center gap-2 mb-2 flex-wrap">
                      <View className="bg-brand-navy/10 px-2.5 py-1 rounded-md border border-brand-navy/10">
                        <Text className="text-xs font-bold text-brand-navy">
                          {selectedTask.course_name ?? "Course"}
                        </Text>
                      </View>
                      <View className={`px-2.5 py-1 rounded-full ${getPriorityBadge(selectedTask.priority).bg}`}>
                        <Text className={`text-xs font-black uppercase tracking-wider ${getPriorityBadge(selectedTask.priority).text}`}>
                          {getPriorityBadge(selectedTask.priority).label} Priority
                        </Text>
                      </View>
                      {isTaskOverdue && (
                        <View className="bg-red-100 px-2.5 py-1 rounded-full">
                          <Text className="text-xs font-black text-red-700 uppercase tracking-wider">
                            Overdue
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-lg font-black text-brand-navy">
                      {selectedTask.title}
                    </Text>
                  </View>

                  <Pressable
                    onPress={closeTaskModal}
                    className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center active:bg-slate-200"
                  >
                    <Feather name="x" size={18} color="#5B6472" />
                  </Pressable>
                </View>
                
                <ScrollView showsVerticalScrollIndicator={false} className="mb-6">
                  {selectedTask.deadline && (
                    <View className="flex-row items-center gap-2 mb-4 bg-slate-50 p-3 rounded-xl border border-brand-hair">
                      <Feather name="calendar" size={16} color={isTaskOverdue && !selectedTask.is_completed ? "#B91C1C" : "#8B1E3F"} />
                      <View>
                        <Text className="text-[10px] font-bold text-brand-slate uppercase">Deadline</Text>
                        <Text className={`text-xs font-bold ${isTaskOverdue && !selectedTask.is_completed ? "text-red-700" : "text-brand-navy"}`}>
                          {formatDeadline(selectedTask.deadline)}
                        </Text>
                      </View>
                    </View>
                  )}

                  <Text className="text-xs font-bold text-brand-slate uppercase tracking-wider mb-1">
                    Description
                  </Text>
                  <Text className="text-sm text-brand-navy leading-relaxed bg-brand-card p-4 rounded-xl border border-brand-hair">
                    {selectedTask.description || "No description provided for this task."}
                  </Text>
                </ScrollView>
                
                <View className="flex-row items-center gap-3 pt-2 border-t border-brand-hair">
                  <Pressable
                    className={`flex-1 py-3.5 rounded-xl items-center justify-center flex-row gap-2 ${
                      selectedTask.is_completed ? "bg-slate-200" : "bg-brand-navy"
                    }`}
                    onPress={() => {
                      setTasks((prev) =>
                        prev.map((t) =>
                          t.id === selectedTask.id
                            ? { ...t, is_completed: !t.is_completed }
                            : t
                        )
                      );
                      setSelectedTask((prev) => prev ? { ...prev, is_completed: !prev.is_completed } : null);
                    }}
                  >
                    <Feather
                      name={selectedTask.is_completed ? "x-circle" : "check-circle"}
                      size={16}
                      color={selectedTask.is_completed ? "#14213D" : "#FFFFFF"}
                    />
                    <Text
                      className={`text-xs font-bold ${
                        selectedTask.is_completed ? "text-brand-navy" : "text-white"
                      }`}
                    >
                      {selectedTask.is_completed ? "Mark Incomplete" : "Mark Complete"}
                    </Text>
                  </Pressable>

                  <Pressable
                    className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 items-center justify-center active:bg-red-100"
                    onPress={() => {
                      setTasks((prev) => prev.filter((t) => t.id !== selectedTask.id));
                      closeTaskModal();
                    }}
                  >
                    <Feather name="trash-2" size={18} color="#B91C1C" />
                  </Pressable>
                </View>
              </Animated.View>
            );
          })()}
        </View>
      </Modal>
    </SafeAreaView>
  );
}