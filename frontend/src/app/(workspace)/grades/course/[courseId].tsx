import { useState, useCallback } from "react";
import {
  ScrollView,
  Text,
  useWindowDimensions,
  View,
  Pressable,
  Modal,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { apiRequest } from "../../../../utils/api";
import {
  Course,
  courseGrade,
  courseFinalPercentage,
  componentPercentage,
  GradeComponent,
} from "../../../../utils/grades";
import { CustomAlertModal, AlertState } from "../../../../utils/alert";

export default function CourseGradeManager() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const wide = width >= 700;

  const [addGradeModal, setAddGradeModal] = useState(false);
  
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    title: "",
  });

  const closeAlert = () => {
    setAlertState((prev) => ({ ...prev, visible: false }));
  };
  
  const [componentModal, setComponentModal] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<GradeComponent | null>(null);
  const [componentName, setComponentName] = useState("");
  const [componentWeight, setComponentWeight] = useState("");
  const [componentError, setComponentError] = useState<string | null>(null);
  const [isSavingComponent, setIsSavingComponent] = useState(false);

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

  const openComponentModal = (category: GradeComponent | null = null) => {
    setSelectedComponent(category);
    setComponentName(category ? category.name : "");
    setComponentWeight(category ? category.weight.toString() : "");
    setComponentError(null);
    setComponentModal(true);
  };

  const closeComponentModal = () => {
    setComponentModal(false);
    setSelectedComponent(null);
    setComponentName("");
    setComponentWeight("");
    setComponentError(null);
  };

  const handleSaveComponent = async () => {
    if (!componentName.trim() || !componentWeight.trim()) {
      setComponentError("Please enter both a name and weight.");
      return;
    }

    setComponentError(null);
    setIsSavingComponent(true);

    const isEditing = !!selectedComponent;
    const url = isEditing
      ? `/grade-components/${selectedComponent.id}/`
      : `/courses/${courseId}/grade-components/`;
    const method = isEditing ? "PATCH" : "POST";

    const payload = isEditing
      ? { name: componentName.trim(), weight: parseFloat(componentWeight) }
      : { course: courseId, name: componentName.trim(), weight: parseFloat(componentWeight) };

    const { error } = await apiRequest(url, {
      method,
      body: JSON.stringify(payload),
    });

    setIsSavingComponent(false);

    if (error) {
      setComponentError(error);
    } else {
      closeComponentModal();
      loadCourse();
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

  const handleDeleteGradeComponent = (componentId: number | string, componentName: string) => {
    showConfirm(
      "Delete Component",
      `Are you sure you want to delete "${componentName}" and all of its items?`,
      async () => {
        const { error: deleteError } = await apiRequest(`/grade-components/${componentId}/`, {
          method: "DELETE",
        });

        if (deleteError) {
          showAlert("Error", deleteError);
        } else {
          loadCourse();
        }
      },
      "Delete"
    );
  };

  const handleDeleteGradeEntry = (entryId: number | string, entryName: string) => {
    setAlertState({
      visible: true,
      title: "Delete Grade",
      message: `Are you sure you want to delete "${entryName}"?`,
      type: "confirm",
      confirmText: "Delete",
      onConfirm: async () => {
        const { error: deleteError } = await apiRequest(`/grade-entries/${entryId}/`, {
          method: "DELETE",
        });

        if (deleteError) {
          setAlertState({
            visible: true,
            title: "Error",
            message: deleteError,
            type: "alert",
          });
        } else {
          loadCourse();
        }
      },
    });
  };

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
  const rawOverallGrade = courseFinalPercentage(course);
  const categories = course.grade_components ?? [];

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <StatusBar style="light" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <CustomAlertModal
          state={alertConfig}
          onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
        />
        
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
                className="bg-white/15 px-3 py-1.5 rounded-full flex-row items-center gap-1 active:bg-white/25"
                onPress={() => openComponentModal(null)}
              >
                <Feather name="folder-plus" size={14} color="#FFFFFF" />
                <Text className="text-white text-xs font-bold uppercase tracking-wider">
                  Add Component
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
            <View className="bg-brand-card border border-brand-hair rounded-xl p-3 mb-5 flex-row items-center justify-between">
              <Text className="text-brand-slate text-xs font-bold uppercase tracking-wider">
                Overall Course Raw Grade
              </Text>
              <View className="bg-brand-navy/5 border border-brand-navy/10 px-3 py-1 rounded-full">
                <Text className="text-brand-navy text-xs font-black">
                  {rawOverallGrade !== null ? `${rawOverallGrade.toFixed(2)}%` : "N/A"}
                </Text>
              </View>
            </View>

            <View className="items-center mb-4 z-0" style={{ zIndex: 0 }}>
              <Text className="text-brand-navy text-[11px] font-black uppercase tracking-widest mb-1">
                Grade Breakdown & Assessment Items
              </Text>
              <View className="w-8 h-0.5 bg-brand-gold rounded-full" />
            </View>

            {categories.length === 0 ? (
              <View className="items-center py-8 gap-3">
                <Text className="text-brand-slate text-xs font-medium text-center">
                  No grade components yet. Add a component to get started.
                </Text>
                <Pressable
                  className="bg-brand-navy px-4 py-2 rounded-full flex-row items-center gap-1.5 active:opacity-90"
                  onPress={() => openComponentModal(null)}
                >
                  <Feather name="folder-plus" size={14} color="#FFFFFF" />
                  <Text className="text-white text-xs font-bold uppercase tracking-wider">
                    Add Component
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View className="gap-4">
                {categories.map((category) => {
                  const hasEntries = (category.entries ?? []).length > 0;
                  const rawGrade = hasEntries ? componentPercentage(category) : null;

                  return (
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
                          <Pressable
                            hitSlop={6}
                            className="p-1 active:opacity-60"
                            onPress={() => openComponentModal(category)}
                          >
                            <Feather name="edit-2" size={12} color="#5B6472" />
                          </Pressable>
                          <Pressable
                            hitSlop={6}
                            className="p-1 active:opacity-60"
                            onPress={() => handleDeleteGradeComponent(category.id, category.name)}
                          >
                            <Feather name="trash-2" size={12} color="#8B1E3F" />
                          </Pressable>
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
                                {item.max_score > 0
                                  ? ((item.score / item.max_score) * 100).toFixed(0)
                                  : "0"}
                                %
                              </Text>

                              <Pressable hitSlop={6} className="p-1 active:opacity-60">
                                <Feather name="edit-2" size={12} color="#5B6472" />
                              </Pressable>
                              <Pressable
                                hitSlop={6}
                                className="p-1 active:opacity-60"
                                onPress={() => handleDeleteGradeEntry(item.id, item.name)}
                              >
                                <Feather name="trash-2" size={12} color="#8B1E3F" />
                              </Pressable>
                            </View>
                          </View>
                        ))}
                      </View>

                      <View className="mt-3 pt-2.5 border-t border-brand-hair/60 flex-row justify-between items-center px-1">
                        <Text className="text-brand-slate text-[10px] font-bold uppercase tracking-wider">
                          Component Raw Grade
                        </Text>
                        <Text className="text-brand-navy text-xs font-black">
                          {rawGrade !== null ? `${rawGrade.toFixed(2)}%` : "N/A"}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* Unified Component Modal (Create & Edit) */}
        <Modal
          visible={componentModal}
          transparent
          animationType="fade"
          onRequestClose={closeComponentModal}
        >
          <View className="flex-1 justify-center items-center bg-brand-navy/60 px-6">
            <View className="w-full max-w-[360px] bg-white rounded-2xl p-5 border border-brand-hair">
              <Text className="text-brand-navy text-xs font-black uppercase tracking-widest mb-3">
                {selectedComponent ? "Edit Component" : "Add Grade Component"}
              </Text>

              <TextInput
                className="bg-brand-card border border-brand-hair rounded-xl px-3.5 py-2.5 text-brand-navy text-xs font-medium mb-2"
                placeholder="Component Name (e.g., Exams, Quizzes)"
                placeholderTextColor="#A8ADB8"
                value={componentName}
                onChangeText={(text) => {
                  setComponentName(text);
                  if (componentError) setComponentError(null);
                }}
                autoFocus
              />

              <TextInput
                className="bg-brand-card border border-brand-hair rounded-xl px-3.5 py-2.5 text-brand-navy text-xs font-medium mb-2"
                placeholder="Weight (%)"
                placeholderTextColor="#A8ADB8"
                keyboardType="numeric"
                value={componentWeight}
                onChangeText={(text) => {
                  setComponentWeight(text);
                  if (componentError) setComponentError(null);
                }}
              />

              {componentError && (
                <Text className="text-brand-crimson text-xs mb-2">{componentError}</Text>
              )}

              <View className="flex-row justify-end gap-2 mt-3">
                <Pressable
                  className="px-4 py-2 rounded-full border border-brand-hair bg-white"
                  onPress={closeComponentModal}
                >
                  <Text className="text-brand-slate text-xs font-bold uppercase">Cancel</Text>
                </Pressable>

                <Pressable
                  className="px-4 py-2 rounded-full bg-brand-gold active:opacity-90 min-w-[70px] items-center"
                  onPress={handleSaveComponent}
                  disabled={isSavingComponent}
                >
                  {isSavingComponent ? (
                    <ActivityIndicator size="small" color="#14213D" />
                  ) : (
                    <Text className="text-brand-navy text-xs font-black uppercase">
                      {selectedComponent ? "Save" : "Add"}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Add Assessment Grade Modal */}
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
                  <Text className="text-brand-slate text-[10px] uppercase font-bold">
                    Assessment Name
                  </Text>
                  <Text className="text-brand-navy text-xs font-medium">
                    Quiz 3: Array Functions
                  </Text>
                </View>

                <View className="flex-row gap-2">
                  <View className="flex-1 bg-brand-card border border-brand-hair rounded-xl px-3.5 py-2">
                    <Text className="text-brand-slate text-[10px] uppercase font-bold">
                      Score
                    </Text>
                    <Text className="text-brand-navy text-xs font-medium">95</Text>
                  </View>
                  <View className="flex-1 bg-brand-card border border-brand-hair rounded-xl px-3.5 py-2">
                    <Text className="text-brand-slate text-[10px] uppercase font-bold">
                      Max Score
                    </Text>
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
                  <Text className="text-brand-navy text-xs font-black uppercase">
                    Save Item
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}