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
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [submittingTask, setSubmittingTask] = useState<boolean>(false);
  
  const [taskTitle, setTaskTitle] = useState<string>("");
  const [taskDescription, setTaskDescription] = useState<string>("");
  const [taskCourseId, setTaskCourseId] = useState<number | null>(null);
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [taskDeadline, setTaskDeadline] = useState<Date>(new Date());
  
  const [showPickerMode, setShowPickerMode] = useState<"date" | "time" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
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

  const formSlideAnim = useRef(new Animated.Value(300)).current;
  const formFadeAnim = useRef(new Animated.Value(0)).current;

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

  const closeDetailModal = () => {
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

  const openFormModal = (taskToEdit?: TaskItem) => {
    resetTaskForm();
    
    if (taskToEdit) {
      setEditingTaskId(taskToEdit.id);
      setTaskTitle(taskToEdit.title);
      setTaskDescription(taskToEdit.description || "");
      setTaskCourseId(taskToEdit.course);
      setTaskPriority(taskToEdit.priority);
      if (taskToEdit.deadline) {
        setTaskDeadline(new Date(taskToEdit.deadline));
      }
    }

    setIsTaskModalOpen(true);
    formFadeAnim.setValue(0);
    formSlideAnim.setValue(300);

    Animated.parallel([
      Animated.timing(formFadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(formSlideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeFormModal = () => {
    Animated.parallel([
      Animated.timing(formFadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(formSlideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsTaskModalOpen(false);
      setEditingTaskId(null);
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
        if (coursesRes.data.length > 0 && !taskCourseId) {
          setTaskCourseId(coursesRes.data[0].id);
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
      closeDetailModal();
      if (id) fetchTasks(id);
    }
  };

  const resetTaskForm = () => {
    setEditingTaskId(null);
    setTaskTitle("");
    setTaskDescription("");
    setTaskPriority("medium");
    setTaskDeadline(new Date());
    setShowPickerMode(null);
    setFormError(null);
    setTitleError(false);
    setCourseError(false);
    if (courses.length > 0) setTaskCourseId(courses[0].id);
  };

  const handleSaveTask = async () => {
    let hasError = false;

    if (!taskTitle.trim()) {
      setTitleError(true);
      hasError = true;
    } else {
      setTitleError(false);
    }

    if (!taskCourseId) {
      setCourseError(true);
      hasError = true;
    } else {
      setCourseError(false);
    }

    if (hasError) {
      setFormError("Please fill in all required fields.");
      return;
    }

    setFormError(null);
    setSubmittingTask(true);

    const payload = {
      course: taskCourseId,
      title: taskTitle.trim(),
      description: taskDescription.trim() || undefined,
      priority: taskPriority,
      deadline: taskDeadline.toISOString(),
      is_completed: editingTaskId ? selectedTask?.is_completed : false,
    };

    const endpoint = editingTaskId
      ? `/tasks/${editingTaskId}/`
      : `/classes/${id}/tasks/`;
    const method = editingTaskId ? "PATCH" : "POST";

    const { error } = await apiRequest(endpoint, {
      method,
      body: JSON.stringify(payload),
    });

    setSubmittingTask(false);

    if (error) {
      setFormError(error);
    } else {
      closeFormModal();
      if (editingTaskId) closeDetailModal();
      resetTaskForm();
      if (id) fetchTasks(id);
    }
  };

  const handleDeleteTask = (taskId: number) => {
    showConfirm(
      "Delete Task",
      "Are you sure you want to delete this task?",
      async () => {
        const { error } = await apiRequest(`/tasks/${taskId}/`, {
          method: "DELETE",
        });

        if (error) {
          showAlert("Delete Failed", error);
        } else {
          closeDetailModal();
          if (id) fetchTasks(id);
        }
      },
      "Delete"
    );
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
                onPress={() => openFormModal()}
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
        onPress={() => openFormModal()}
      >
        <Feather name="plus" size={24} color="#FFFFFF" />
      </Pressable>
      
      <Modal
        visible={!!selectedTask}
        animationType="none"
        transparent={true}
        onRequestClose={closeDetailModal}
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
            <Pressable style={StyleSheet.absoluteFillObject} onPress={closeDetailModal} />
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
                    onPress={closeDetailModal}
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
                    onPress={() => openFormModal(selectedTask)}
                    className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 items-center justify-center active:bg-slate-200"
                  >
                    <Feather name="edit-2" size={18} color="#14213D" />
                  </Pressable>

                  <Pressable
                    onPress={() => handleDeleteTask(selectedTask.id)}
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
        visible={isTaskModalOpen}
        animationType="none"
        transparent={true}
        onRequestClose={closeFormModal}
      >
        <View style={StyleSheet.absoluteFillObject}>
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: "rgba(20, 33, 61, 0.6)",
                opacity: formFadeAnim,
              },
            ]}
          >
            <Pressable style={StyleSheet.absoluteFillObject} onPress={closeFormModal} />
          </Animated.View>

          <Animated.View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "#FFFFFF",
              padding: 24,
              transform: [{ translateY: formSlideAnim }],
            }}
            className="rounded-t-3xl shadow-2xl max-h-[85%]"
          >
            <View className="items-center mb-2">
              <View className="w-12 h-1.5 bg-slate-200 rounded-full" />
            </View>

            <View className="flex-row items-center justify-between mb-4 pb-2 border-b border-brand-hair">
              <Text className="text-lg font-black text-brand-navy uppercase tracking-wide">
                {editingTaskId ? "Edit Task" : "Add New Task"}
              </Text>
              <Pressable
                onPress={closeFormModal}
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
                  value={taskTitle}
                  onChangeText={(text) => {
                    setTaskTitle(text);
                    if (titleError) setTitleError(false);
                    if (formError) setFormError(null);
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
                      const isSelected = taskCourseId === course.id;
                      return (
                        <Pressable
                          key={course.id}
                          onPress={() => {
                            setTaskCourseId(course.id);
                            if (courseError) setCourseError(false);
                            if (formError) setFormError(null);
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
                    const isSelected = taskPriority === p;
                    return (
                      <Pressable
                        key={p}
                        onPress={() => setTaskPriority(p)}
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
                      {taskDeadline.toLocaleDateString()}
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
                      {taskDeadline.toLocaleTimeString([], {
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
                          ? dateToYYYYMMDD(taskDeadline)
                          : dateToHHMM(taskDeadline)
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          const updatedDate = new Date(taskDeadline);
                          if (showPickerMode === "date") {
                            const [year, month, day] = val.split("-").map(Number);
                            updatedDate.setFullYear(year, month - 1, day);
                          } else {
                            const [hours, minutes] = val.split(":").map(Number);
                            updatedDate.setHours(hours, minutes);
                          }
                          setTaskDeadline(updatedDate);
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
                      value={taskDeadline}
                      mode={showPickerMode}
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={(event, selectedDate) => {
                        setShowPickerMode(null);
                        if (selectedDate) setTaskDeadline(selectedDate);
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
                  value={taskDescription}
                  onChangeText={setTaskDescription}
                  placeholder="Optional details, notes, or instructions..."
                  multiline
                  numberOfLines={3}
                  style={{ textAlignVertical: "top" }}
                  className="bg-brand-card border border-brand-hair p-3 rounded-xl text-sm font-semibold text-brand-navy min-h-[80px]"
                />
              </View>

              {formError && (
                <Text className="text-brand-crimson text-xs mt-1">{formError}</Text>
              )}
            </ScrollView>

            <Pressable
              className={`py-3.5 rounded-xl items-center justify-center bg-brand-navy ${
                submittingTask ? "opacity-70" : ""
              }`}
              onPress={handleSaveTask}
              disabled={submittingTask}
            >
              {submittingTask ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text className="text-white text-xs font-bold uppercase tracking-wider">
                  {editingTaskId ? "Update Task" : "Save Task"}
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