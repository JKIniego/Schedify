import { useState, useCallback } from "react";
import {
  ScrollView,
  Text,
  useWindowDimensions,
  View,
  Pressable,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { apiRequest } from "../../../../utils/api";
import { Course, courseGrade } from "../../../../utils/grades";

export default function CourseGradeManager() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const wide = width >= 700;

  const [addGradeModal, setAddGradeModal] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCourse = useCallback(async () => {
    setError(null);
    setLoading(true);
    const { data, error: reqError } = await apiRequest<Course>(`/courses/${courseId}/`);
    if (reqError) {
      setError(reqError);
    } else if (data) {
      setCourse(data);
    }
    setLoading(false);
  }, [courseId]);

  useFocusEffect(
    useCallback(() => {
      loadCourse();
    }, [loadCourse])
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (error || !course) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-brand-slate text-xs text-center">
          {error ?? "Course not found."}
        </Text>
      </SafeAreaView>
    );
  }

  const currentGrade = courseGrade(course);
  const categories = course.grade_components ?? [];

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <StatusBar style="light" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="bg-brand-navy pt-4 pb-8 items-center">
          <View style={{ width: "100%", maxWidth: width, paddingHorizontal: wide ? 32 : 24 }}>
            <View className="flex-row items-center justify-between mb-4">
              <Pressable
                className="flex-row items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full active:bg-white/20"
                onPress={() => router.back()}
              >
                <Feather name="arrow-left" size={14} color="#FFFFFF" />
                <Text className="text-white text-xs font-bold uppercase tracking-wider">
                  Back
                </Text>
              </Pressable>

              <Pressable
                className="bg-brand-gold px-3.5 py-1.5 rounded-full flex-row items-center gap-1 active:opacity-90"
                onPress={() => setAddGradeModal(true)}
              >
                <Feather name="plus" size={14} color="#14213D" />
                <Text className="text-brand-navy text-xs font-bold uppercase tracking-wider">
                  Add Grade
                </Text>
              </Pressable>
            </View>
            
            <Text className="text-brand-gold text-xs font-black uppercase tracking-widest text-center">
              {course.name}
            </Text>

            <View className="bg-white/10 rounded-2xl p-4 border border-white/15 backdrop-blur-md mt-5 flex-row items-center justify-around">
              <View className="items-center">
                <Text className="text-brand-gold text-3xl font-black">
                  {currentGrade !== null ? currentGrade.toFixed(2) : "N/A"}
                </Text>
                <Text className="text-white/80 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                  Current Grade
                </Text>
              </View>

              <View className="w-px h-8 bg-white/20" />

              <View className="items-center">
                <Text className="text-white text-3xl font-black">
                  {course.units}
                </Text>
                <Text className="text-white/80 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                  Units
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        <View className="items-center py-6">
          <View style={{ width: "100%", maxWidth: width, paddingHorizontal: wide ? 32 : 24 }}>
            
            <View className="items-center mb-4 z-0" style={{ zIndex: 0 }}>
              <Text className="text-brand-navy text-[11px] font-black uppercase tracking-widest mb-1">
                Grade Breakdown & Assessment Items
              </Text>
              <View className="w-8 h-0.5 bg-brand-gold rounded-full" />
            </View>
            
            {categories.length === 0 ? (
              <View className="items-center py-8">
                <Text className="text-brand-slate text-xs font-medium text-center">
                  No grade categories yet. Tap "Add Grade" to get started.
                </Text>
              </View>
            ) : (
            <View className="gap-4">
              {categories.map((category) => (
                <View
                  key={category.id}
                  className="rounded-2xl bg-brand-card border border-brand-hair p-4"
                >
                  <View className="flex-row items-center justify-between border-b border-brand-hair pb-2.5 mb-3">
                    <View className="flex-row items-center gap-2">
                      <Feather name="folder" size={14} color="#14213D" />
                      <Text className="text-brand-navy font-bold text-sm">
                        {category.name}
                      </Text>
                    </View>
                    <View className="bg-brand-navy/5 px-2.5 py-1 rounded-full border border-brand-navy/10">
                      <Text className="text-brand-navy text-[10px] font-black">
                        Weight: {parseFloat(category.weight)}%
                      </Text>
                    </View>
                  </View>
                  
                  <View className="gap-2">
                    {(category.entries ?? []).map((item) => (
                      <View
                        key={item.id}
                        className="bg-white border border-brand-hair/80 rounded-xl p-3 flex-row items-center justify-between"
                      >
                        <View className="flex-1 pr-2">
                          <Text className="text-brand-navy text-xs font-bold">
                            {item.name}
                          </Text>
                          <Text className="text-brand-slate text-[10px] font-medium">
                            Score: {item.score} / {item.max_score}
                          </Text>
                        </View>

                        <View className="flex-row items-center gap-3">
                          <Text className="text-brand-navy text-xs font-black">
                            {item.max_score > 0 ? ((item.score / item.max_score) * 100).toFixed(0) : "0"}%
                          </Text>
                          
                          <Pressable hitSlop={6} className="p-1 active:opacity-60">
                            <Feather name="edit-2" size={12} color="#5B6472" />
                          </Pressable>
                          <Pressable hitSlop={6} className="p-1 active:opacity-60">
                            <Feather name="trash-2" size={12} color="#8B1E3F" />
                          </Pressable>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
            )}
          </View>
        </View>
        
        <Modal
          visible={addGradeModal}
          transparent
          animationType="fade"
          onRequestClose={() => setAddGradeModal(false)}
        >
          <View className="flex-1 justify-center items-center bg-brand-navy/60 px-6">
            <View className="w-full max-w-[360px] bg-white rounded-2xl p-5 border border-brand-hair">
              <Text className="text-brand-navy text-xs font-black uppercase tracking-widest mb-3">
                Add Assessment Grade
              </Text>

              <View className="gap-2.5 mb-4">
                <View className="bg-brand-card border border-brand-hair rounded-xl px-3.5 py-2">
                  <Text className="text-brand-slate text-[10px] uppercase font-bold">Assessment Name</Text>
                  <Text className="text-brand-navy text-xs font-medium">Quiz 3: Array Functions</Text>
                </View>

                <View className="flex-row gap-2">
                  <View className="flex-1 bg-brand-card border border-brand-hair rounded-xl px-3.5 py-2">
                    <Text className="text-brand-slate text-[10px] uppercase font-bold">Score</Text>
                    <Text className="text-brand-navy text-xs font-medium">95</Text>
                  </View>
                  <View className="flex-1 bg-brand-card border border-brand-hair rounded-xl px-3.5 py-2">
                    <Text className="text-brand-slate text-[10px] uppercase font-bold">Max Score</Text>
                    <Text className="text-brand-navy text-xs font-medium">100</Text>
                  </View>
                </View>
              </View>

              <View className="flex-row justify-end gap-2">
                <Pressable
                  className="px-4 py-2 rounded-full border border-brand-hair bg-white"
                  onPress={() => setAddGradeModal(false)}
                >
                  <Text className="text-brand-slate text-xs font-bold uppercase">Cancel</Text>
                </Pressable>

                <Pressable
                  className="px-4 py-2 rounded-full bg-brand-gold active:opacity-90"
                  onPress={() => setAddGradeModal(false)}
                >
                  <Text className="text-brand-navy text-xs font-black uppercase">Save Item</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

      </ScrollView>
    </SafeAreaView>
  );
}