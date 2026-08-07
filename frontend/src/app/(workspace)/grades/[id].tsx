import { useState, useCallback } from "react";
import {
  ScrollView,
  Text,
  useWindowDimensions,
  View,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { apiRequest } from "../../../utils/api";
import { Course, courseGrade, gwa as computeGwa } from "../../../utils/grades";

export default function Grades() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const wide = width >= 700;

  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCourses = useCallback(async () => {
    setError(null);
    setLoading(true);
    const { data, error: reqError } = await apiRequest<Course[]>(`/classes/${id}/courses/`);
    if (reqError) {
      setError(reqError);
    } else if (data) {
      setCourses(data);
    }
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadCourses();
    }, [loadCourses])
  );

  const courseGrades = courses.map((course) => ({
    course,
    grade: courseGrade(course),
  }));

  const totalUnits = courseGrades.reduce((sum, c) => sum + c.course.units, 0);
  const overallGwa = computeGwa(courses);

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

            <Text className="text-white text-xl font-black uppercase tracking-wide text-center mb-5">
              Academic Summary
            </Text>

            {error && (
              <Text className="text-red-300 text-xs text-center mb-3">{error}</Text>
            )}

            {loading ? (
              <View className="bg-white/10 rounded-2xl p-5 border border-white/15 backdrop-blur-md">
                <View className="py-12 items-center justify-center">
                  <ActivityIndicator size="small" color="white" />
                </View>
              </View>
            ) : (
              <View className="bg-white/10 rounded-2xl p-5 border border-white/15 backdrop-blur-md">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-white/80 text-xs font-bold uppercase tracking-widest">
                    General Weighted Average
                  </Text>
                </View>

                <View className="flex-row items-baseline gap-2">
                  <Text className="text-brand-gold text-4xl font-black tracking-tight">
                    {overallGwa !== null ? overallGwa.toFixed(3) : "N/A"}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between mt-4 pt-3 border-t border-white/10">
                  <View className="flex-row items-center gap-1.5">
                    <Feather name="book-open" size={13} color="#C9A227" />
                    <Text className="text-white/80 text-xs font-semibold">
                      {courses.length} Courses Recorded
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1.5">
                    <Feather name="check-circle" size={13} color="#4ADE80" />
                    <Text className="text-white/80 text-xs font-semibold">
                      {totalUnits} Units Completed
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>

        <View className="items-center py-6">
          <View style={{ width: "100%", maxWidth: width, paddingHorizontal: wide ? 32 : 24 }}>
            <View className="items-center mb-4 z-0" style={{ zIndex: 0 }}>
              <Text className="text-brand-navy text-[11px] font-black uppercase tracking-widest mb-1">
                Enrolled Courses ({courses.length})
              </Text>
              <View className="w-8 h-0.5 bg-brand-gold rounded-full" />
            </View>

            {loading ? (
              <View className="py-12 items-center justify-center">
                <ActivityIndicator size="small" color="#14213D" />
              </View>
            ) : courseGrades.length === 0 ? (
              <View className="items-center py-8 gap-3">
                <Text className="text-brand-slate text-xs font-medium text-center">
                  No courses enrolled yet for this term.
                </Text>
              </View>
            ) : (
              <View className="gap-3">
                {courseGrades.map(({ course, grade }) => {
                  const isSelected = selectedCourseId === course.id;

                  return (
                    <Pressable
                      key={course.id}
                      onPress={() => setSelectedCourseId(isSelected ? null : course.id)}
                      className={`relative overflow-hidden rounded-2xl bg-brand-card border p-4 transition-all active:scale-[0.99] ${
                        isSelected ? "border-brand-gold/60 shadow-xs" : "border-brand-hair"
                      }`}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1 pr-3">
                          <View className="flex-row items-center gap-2 mb-1">
                            <Text className="text-brand-navy font-black text-sm tracking-wide">
                              {course.name}
                            </Text>
                            <Text className="text-brand-slate text-xs font-medium">
                              • {course.units} Units
                            </Text>
                          </View>
                        </View>

                        <View className="bg-brand-navy/5 border border-brand-navy/10 px-3 py-1.5 rounded-xl items-center">
                          <Text className="text-brand-navy font-black text-base">
                            {grade !== null ? grade.toFixed(2) : "N/A"}
                          </Text>
                          <Text className="text-brand-slate text-[9px] font-bold uppercase tracking-wider">
                            Grade
                          </Text>
                        </View>
                      </View>

                      {isSelected && (
                        <View className="mt-3 pt-3 border-t border-brand-hair/80 flex-row items-center justify-between">
                          <View className="flex-row items-center gap-1.5">
                            <Feather
                              name={grade !== null ? "award" : "clock"}
                              size={12}
                              color="#14213D"
                            />
                            <Text className="text-brand-navy text-xs font-bold">
                              {grade === null ? "No grades yet" : grade <= 3.0 ? "Passed" : "At risk"}
                            </Text>
                          </View>

                          <Pressable
                            className="flex-row items-center gap-1.5 bg-brand-navy px-3 py-1.5 rounded-full active:opacity-90"
                            onPress={() => router.push(`./course/${course.id}`)}
                            hitSlop={6}
                          >
                            <Text className="text-white text-[10px] font-bold uppercase tracking-wider">
                              Manage
                            </Text>
                            <Feather name="chevron-right" size={12} color="#FFFFFF" />
                          </Pressable>
                        </View>
                      )}
                    </Pressable>
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