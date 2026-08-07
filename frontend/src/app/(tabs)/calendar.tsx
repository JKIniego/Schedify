import React, { useState, useCallback, useMemo } from "react";
import {
  ScrollView,
  Text,
  useWindowDimensions,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Calendar, DateData } from "react-native-calendars";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { apiRequest } from "../../utils/api";

export interface Task {
  id: number;
  course: number;
  course_name?: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  deadline: string;
  is_completed: boolean;
  mark_as_completed_date?: string | null;
}

export default function CalendarScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 700;

  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: reqError } = await apiRequest<Task[]>("/tasks/active/");

    if (reqError) {
      setError(reqError);
    } else if (data) {
      setTasks(data);
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [fetchTasks])
  );

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((task) => {
      if (!task.deadline) return;
      const dateKey = task.deadline.split("T")[0];
      if (!map[dateKey]) {
        map[dateKey] = [];
      }
      map[dateKey].push(task);
    });
    return map;
  }, [tasks]);

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    Object.keys(tasksByDate).forEach((dateKey) => {
      marks[dateKey] = {
        marked: true,
        dotColor: "#FCA311",
      };
    });

    marks[selectedDate] = {
      ...(marks[selectedDate] || {}),
      selected: true,
      selectedColor: "#14213D",
      selectedTextColor: "#FCA311",
    };

    return marks;
  }, [tasksByDate, selectedDate]);

  const selectedDayTasks = tasksByDate[selectedDate] || [];

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
            </View>

            <Text className="text-brand-gold text-xs font-black uppercase tracking-widest text-center">
              Active Schedule & Tasks
            </Text>

            <View className="bg-white/10 rounded-2xl p-4 border border-white/15 backdrop-blur-md mt-5 flex-row items-center justify-around">
              <View className="items-center">
                <Text className="text-brand-gold text-2xl font-black">
                  {selectedDate}
                </Text>
                <Text className="text-white/80 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                  Selected Date
                </Text>
              </View>

              <View className="w-px h-8 bg-white/20" />

              <View className="items-center">
                <Text className="text-white text-2xl font-black">
                  {selectedDayTasks.length}
                </Text>
                <Text className="text-white/80 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                  Tasks Due
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        <View className="items-center py-6">
          <View style={{ width: "100%", maxWidth: width, paddingHorizontal: wide ? 32 : 24 }}>
            <View className="rounded-2xl bg-brand-card border border-brand-hair p-2 overflow-hidden shadow-xs mb-6">
              <Calendar
                onDayPress={handleDayPress}
                markedDates={markedDates}
                theme={{
                  calendarBackground: "transparent",
                  textSectionTitleColor: "#5B6472",
                  selectedDayBackgroundColor: "#14213D",
                  selectedDayTextColor: "#FCA311",
                  todayTextColor: "#FCA311",
                  dayTextColor: "#14213D",
                  textDisabledColor: "#A8ADB8",
                  arrowColor: "#14213D",
                  monthTextColor: "#14213D",
                  indicatorColor: "#14213D",
                  textDayFontWeight: "600",
                  textMonthFontWeight: "900",
                  textDayHeaderFontWeight: "700",
                  textDayFontSize: 13,
                  textMonthFontSize: 15,
                  textDayHeaderFontSize: 11,
                }}
              />
            </View>

            <View className="items-center mb-4">
              <Text className="text-brand-navy text-xs font-black uppercase tracking-widest mb-1">
                Tasks for {selectedDate}
              </Text>
              <View className="w-8 h-0.5 bg-brand-gold rounded-full" />
            </View>

            {loading ? (
              <View className="py-8 items-center justify-center">
                <ActivityIndicator color="#14213D" />
              </View>
            ) : error ? (
              <View className="rounded-2xl p-4 bg-red-50 border border-red-200 items-center">
                <Text className="text-red-600 text-xs font-medium">{error}</Text>
              </View>
            ) : selectedDayTasks.length === 0 ? (
              <View className="rounded-2xl p-5 bg-brand-card border border-brand-hair gap-2 shadow-xs items-center justify-center py-8">
                <Feather name="check-circle" size={24} color="#5B6472" />
                <Text className="text-brand-slate text-xs font-medium text-center mt-1">
                  No tasks due on this date.
                </Text>
              </View>
            ) : (
              <View className="gap-3">
                {selectedDayTasks.map((task) => (
                  <View
                    key={task.id}
                    className="bg-white border border-brand-hair rounded-xl p-3.5 flex-row items-center justify-between shadow-xs"
                  >
                    <View className="flex-1 pr-3 items-start gap-1">
                      <Text
                        className={`text-brand-navy font-bold text-xs ${
                          task.is_completed ? "line-through text-brand-slate" : ""
                        }`}
                      >
                        {task.title}
                      </Text>
                      {task.course_name && (
                        <View className="bg-brand-navy px-2 py-0.5 rounded-full">
                          <Text className="text-white text-[10px] font-medium tracking-widest mt-0.5">
                            {task.course_name}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View className="flex-row items-center gap-2">
                      <View className="bg-brand-navy/10 px-2 py-0.5 rounded-full">
                        <Text className="text-brand-navy text-[10px] font-bold uppercase">
                          {task.priority}
                        </Text>
                      </View>
                      <View
                        className={`w-2.5 h-2.5 rounded-full ${
                          task.is_completed ? "bg-green-500" : "bg-brand-gold"
                        }`}
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}