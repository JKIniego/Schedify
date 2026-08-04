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
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
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
  mark_as_completed_date?: string | null;
}

interface CourseItem {
  id: number;
  name: string;
}

const dateToHHMM = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

const dateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

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
  
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [submittingTask, setSubmittingTask] = useState<boolean>(false);
  const [newTaskTitle, setNewTaskTitle] = useState<string>("");
  const [newTaskDescription, setNewTaskDescription] = useState<string>("");
  const [newTaskCourseId, setNewTaskCourseId] = useState<number | null>(null);
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [newTaskDeadline, setNewTaskDeadline] = useState<Date>(new Date());
  const [showPickerMode, setShowPickerMode] = useState<"date" | "time" | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<boolean>(false);
  const [courseError, setCourseError] = useState<boolean>(false);

  const webPickerInputRef = useRef<HTMLInputElement | null>(null);
  
  const [alertConfig, setAlertConfig] = useState<AlertState>({
    visible: false,
    title: "",
    message: "",
    type: "alert",
  });

  const showAlert = (title: string, message?: string) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type: "alert",
    });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText: string = "Delete"
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

  const hideAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const addSlideAnim = useRef(new Animated.Value(300)).current;
  const addFadeAnim = useRef(new Animated.Value(0)).current;

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

  const openAddTaskModal = () => {
    resetAddTaskForm();
    setIsAddModalOpen(true);
    addFadeAnim.setValue(0);
    addSlideAnim.setValue(300);

    Animated.parallel([
      Animated.timing(addFadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(addSlideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeAddTaskModal = () => {
    Animated.parallel([
      Animated.timing(addFadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(addSlideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsAddModalOpen(false);
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
      showAlert(
        "Error Loading Tasks",
        coursesRes.error || tasksRes.error || "Failed to load tasks and courses"
      );
    } else {
      if (coursesRes.data) {
        setCourses(coursesRes.data);
        if (coursesRes.data.length > 0) {
          setNewTaskCourseId(coursesRes.data[0].id);
        }
      }
      if (tasksRes.data) setTasks(tasksRes.data);
    }

    setLoading(false);
  };
  
  const isTaskOverdue = (task: TaskItem) => {
    if (!task.deadline) return false;
    
    const deadlineDate = new Date(task.deadline);
    if (isNaN(deadlineDate.getTime())) return false;
    
    if (task.is_completed) {
      if (!task.mark_as_completed_date) return false;
      const completedDate = new Date(task.mark_as_completed_date);
      if (isNaN(completedDate.getTime())) return false;
      
      return completedDate > deadlineDate;
    }
    
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
      overdue: courseFiltered.filter((t) => isTaskOverdue(t)).length,
    };
  }, [tasks, selectedCourse]);

  const filteredTasks = tasks.filter((t) => {
    const matchesCourse =
      selectedCourse === "ALL COURSES" || t.course_name === selectedCourse;

    const isOverdue = isTaskOverdue(t);

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
    const overdue = isTaskOverdue(task);
    
    if (task.is_completed) {
      return {
        cardBg: "bg-emerald-50 border-emerald-200",
        isOverdue: overdue,
        overdueBadgeBg: "bg-red-100",
        overdueBadgeText: "text-red-700",
      };
    }

    if (overdue) {
      return {
        cardBg: "bg-red-50 border-red-200",
        isOverdue: true,
        overdueBadgeBg: "bg-red-100",
        overdueBadgeText: "text-red-700",
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

  const handleMarkAsComplete = async (task: TaskItem) => {
    const updatedStatus = !task.is_completed;
    const completionDate = updatedStatus ? new Date().toISOString() : null;

    const { error } = await apiRequest(`/tasks/${task.id}/`, {
      method: "PATCH",
      body: JSON.stringify({
        is_completed: updatedStatus,
        mark_as_completed_date: completionDate,
      }),
    });

    if (error) {
      showAlert("Updating Status Failed", error);
    } else {
      closeTaskModal();
      if (id) fetchTasks(id);
    }
  };

  const resetAddTaskForm = () => {
    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskPriority("medium");
    setNewTaskDeadline(new Date());
    setShowPickerMode(null);
    setAddError(null);
    setTitleError(false);
    setCourseError(false);
    if (courses.length > 0) setNewTaskCourseId(courses[0].id);
  };

  const handleCreateTask = async () => {
    let hasError = false;

    if (!newTaskTitle.trim()) {
      setTitleError(true);
      hasError = true;
    } else {
      setTitleError(false);
    }

    if (!newTaskCourseId) {
      setCourseError(true);
      hasError = true;
    } else {
      setCourseError(false);
    }

    if (hasError) {
      setAddError("Please fill in all required fields.");
      return;
    }

    setAddError(null);
    setSubmittingTask(true);

    const payload = {
      course: newTaskCourseId,
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim() || undefined,
      priority: newTaskPriority,
      deadline: newTaskDeadline.toISOString(),
      is_completed: false,
    };

    const { error } = await apiRequest(`/classes/${id}/tasks/`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setSubmittingTask(false);

    if (error) {
      setAddError(error);
    } else {
      closeAddTaskModal();
      resetAddTaskForm();
      if (id) fetchTasks(id);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <StatusBar style="light" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="bg-brand-navy pt-4 pb-8 items-center">
          <View style={{ width: "100%", maxWidth: width, paddingHorizontal: wide ? 32 : 24 }}>
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-lg bg-brand-gold items-center justify-center">
                  <Text className="text-brand-navy text-base font-black">S</Text>
                </View>
                <Text className="text-white text-lg font-bold tracking-wide">SCHEDIFY</Text>
              </View>

              <Pressable
                className="bg-brand-gold px-3.5 py-1.5 rounded-full flex-row items-center gap-1 active:opacity-90"
                onPress={openAddTaskModal}
              >
                <Feather name="plus" size={14} color="#14213D" />
                <Text className="text-brand-navy text-xs font-bold uppercase tracking-wider">
                  Add Task
                </Text>
              </Pressable>
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
                      <View className="flex-col gap-1.5">
                        <View className="flex-row items-center justify-between">
                          <View className="bg-brand-navy/10 px-2 py-0.5 rounded border border-brand-navy/10 shrink">
                            <Text 
                              className="text-[10px] font-bold text-brand-navy"
                              numberOfLines={1}
                            >
                              {item.course_name ?? "Course"}
                            </Text>
                          </View>
                        </View>
                        
                        <Text
                          className={`text-xs font-bold leading-snug ${
                            item.is_completed
                              ? "text-brand-slate/50 line-through"
                              : "text-brand-navy"
                          }`}
                          numberOfLines={2}
                        >
                          {item.title}
                        </Text>
                        
                        {cardStyles.isOverdue && (
                          <View className="flex-row">
                            <View className={`px-1.5 py-0.5 rounded-full ${cardStyles.overdueBadgeBg}`}>
                              <Text className={`text-[8px] font-black uppercase tracking-wider ${cardStyles.overdueBadgeText}`}>
                                Overdue
                              </Text>
                            </View>
                          </View>
                        )}
                      </View>
                      
                      {formattedDeadline ? (
                        <View className="flex-row items-center gap-1 mt-3">
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
                      ) : <View />}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      
      <Pressable
        className="absolute bottom-6 right-6 w-14 h-14 bg-brand-navy rounded-full items-center justify-center shadow-xl active:bg-brand-navy/90 z-40"
        onPress={openAddTaskModal}
      >
        <Feather name="plus" size={24} color="#FFFFFF" />
      </Pressable>
      
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
            const isOverdue = isTaskOverdue(selectedTask);

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
                      {isOverdue && (
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
                      <Feather name="calendar" size={16} color={isOverdue && !selectedTask.is_completed ? "#B91C1C" : "#8B1E3F"} />
                      <View>
                        <Text className="text-[10px] font-bold text-brand-slate uppercase">Deadline</Text>
                        <Text className={`text-xs font-bold ${isOverdue && !selectedTask.is_completed ? "text-red-700" : "text-brand-navy"}`}>
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
                    onPress={() => handleMarkAsComplete(selectedTask)}
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
                  >
                    <Feather name="trash-2" size={18} color="#B91C1C" />
                  </Pressable>
                </View>
              </Animated.View>
            );
          })()}
        </View>
      </Modal>
      
      <Modal
        visible={isAddModalOpen}
        animationType="none"
        transparent={true}
        onRequestClose={closeAddTaskModal}
      >
        <View style={StyleSheet.absoluteFillObject}>
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: "rgba(20, 33, 61, 0.6)",
                opacity: addFadeAnim,
              },
            ]}
          >
            <Pressable style={StyleSheet.absoluteFillObject} onPress={closeAddTaskModal} />
          </Animated.View>

          <Animated.View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "#FFFFFF",
              padding: 24,
              transform: [{ translateY: addSlideAnim }],
            }}
            className="rounded-t-3xl shadow-2xl max-h-[85%]"
          >
            <View className="items-center mb-2">
              <View className="w-12 h-1.5 bg-slate-200 rounded-full" />
            </View>

            <View className="flex-row items-center justify-between mb-4 pb-2 border-b border-brand-hair">
              <Text className="text-lg font-black text-brand-navy uppercase tracking-wide">
                Add New Task
              </Text>
              <Pressable
                onPress={closeAddTaskModal}
                className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center active:bg-slate-200"
              >
                <Feather name="x" size={18} color="#5B6472" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="space-y-4 mb-4">
              <View>
                <Text className="text-xs font-bold text-brand-slate uppercase mb-1">
                  Task Title
                </Text>
                <TextInput
                  value={newTaskTitle}
                  onChangeText={(text) => {
                    setNewTaskTitle(text);
                    if (titleError) setTitleError(false);
                    if (addError) setAddError(null);
                  }}
                  placeholder="e.g. Complete Lab Report 3"
                  className={`bg-brand-card border px-4 py-3 rounded-xl text-sm font-semibold text-brand-navy ${
                    titleError ? "border-brand-crimson bg-red-50/20" : "border-brand-hair"
                  }`}
                />
                {titleError && (
                  <Text className="text-brand-crimson text-[11px] font-bold mt-1">
                    Task title is required.
                  </Text>
                )}
              </View>

              <View>
                <Text className="text-xs font-bold text-brand-slate uppercase mb-1">
                  Course
                </Text>
                <View
                  className={`p-1 rounded-2xl ${
                    courseError ? "border border-brand-crimson bg-red-50/20" : ""
                  }`}
                >
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2 py-1">
                    {courses.map((course) => {
                      const isSelected = newTaskCourseId === course.id;
                      return (
                        <Pressable
                          key={course.id}
                          onPress={() => {
                            setNewTaskCourseId(course.id);
                            if (courseError) setCourseError(false);
                            if (addError) setAddError(null);
                          }}
                          className={`px-3 py-2 rounded-xl border ${
                            isSelected
                              ? "bg-brand-navy border-brand-navy"
                              : "bg-white border-brand-hair"
                          }`}
                        >
                          <Text
                            className={`text-xs font-bold ${
                              isSelected ? "text-white" : "text-brand-slate"
                            }`}
                          >
                            {course.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
                {courseError && (
                  <Text className="text-brand-crimson text-[11px] font-bold mt-1">
                    Please select a course.
                  </Text>
                )}
              </View>

              <View>
                <Text className="text-xs font-bold text-brand-slate uppercase mb-1">
                  Priority
                </Text>
                <View className="flex-row gap-2">
                  {(["low", "medium", "high"] as const).map((p) => {
                    const isSelected = newTaskPriority === p;
                    return (
                      <Pressable
                        key={p}
                        onPress={() => setNewTaskPriority(p)}
                        className={`flex-1 py-2.5 rounded-xl border items-center uppercase ${
                          isSelected
                            ? "bg-brand-navy border-brand-navy"
                            : "bg-white border-brand-hair"
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold capitalize ${
                            isSelected ? "text-white" : "text-brand-slate"
                          }`}
                        >
                          {p}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View>
                <Text className="text-xs font-bold text-brand-slate uppercase mb-1">
                  Deadline
                </Text>
                <View className="flex-row gap-2">
                  <Pressable
                    className="flex-1 bg-brand-card border border-brand-hair p-3 rounded-xl flex-row items-center gap-2"
                    onPress={() => {
                      setShowPickerMode("date");
                      if (Platform.OS === "web") {
                        setTimeout(() => webPickerInputRef.current?.showPicker?.(), 50);
                      }
                    }}
                  >
                    <Feather name="calendar" size={16} color="#14213D" />
                    <Text className="text-xs font-bold text-brand-navy">
                      {newTaskDeadline.toLocaleDateString()}
                    </Text>
                  </Pressable>

                  <Pressable
                    className="flex-1 bg-brand-card border border-brand-hair p-3 rounded-xl flex-row items-center gap-2"
                    onPress={() => {
                      setShowPickerMode("time");
                      if (Platform.OS === "web") {
                        setTimeout(() => webPickerInputRef.current?.showPicker?.(), 50);
                      }
                    }}
                  >
                    <Feather name="clock" size={16} color="#14213D" />
                    <Text className="text-xs font-bold text-brand-navy">
                      {newTaskDeadline.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </Pressable>
                </View>

                {showPickerMode && (
                  Platform.OS === "web" ? (
                    <input
                      ref={webPickerInputRef}
                      type={showPickerMode === "date" ? "date" : "time"}
                      value={
                        showPickerMode === "date"
                          ? dateToYYYYMMDD(newTaskDeadline)
                          : dateToHHMM(newTaskDeadline)
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          const updatedDate = new Date(newTaskDeadline);
                          if (showPickerMode === "date") {
                            const [year, month, day] = val.split("-").map(Number);
                            updatedDate.setFullYear(year, month - 1, day);
                          } else {
                            const [hours, minutes] = val.split(":").map(Number);
                            updatedDate.setHours(hours, minutes);
                          }
                          setNewTaskDeadline(updatedDate);
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
                      value={newTaskDeadline}
                      mode={showPickerMode}
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={(event, selectedDate) => {
                        setShowPickerMode(null);
                        if (selectedDate) setNewTaskDeadline(selectedDate);
                      }}
                    />
                  )
                )}
              </View>

              <View>
                <Text className="text-xs font-bold text-brand-slate uppercase mb-1">
                  Description
                </Text>
                <TextInput
                  value={newTaskDescription}
                  onChangeText={setNewTaskDescription}
                  placeholder="Optional details, notes, or instructions..."
                  multiline
                  numberOfLines={3}
                  style={{ textAlignVertical: "top" }}
                  className="bg-brand-card border border-brand-hair p-3 rounded-xl text-sm font-semibold text-brand-navy min-h-[80px]"
                />
              </View>

              {addError && (
                <Text className="text-brand-crimson text-xs mt-1">{addError}</Text>
              )}
            </ScrollView>

            <Pressable
              className={`py-3.5 rounded-xl items-center justify-center bg-brand-navy ${
                submittingTask ? "opacity-70" : ""
              }`}
              onPress={handleCreateTask}
              disabled={submittingTask}
            >
              {submittingTask ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text className="text-white text-xs font-bold uppercase tracking-wider">
                  Save Task
                </Text>
              )}
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
      
      <CustomAlertModal state={alertConfig} onClose={hideAlert} />
    </SafeAreaView>
  );
}