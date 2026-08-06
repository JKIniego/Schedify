import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import {
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";
import { apiRequest } from "../../utils/api";
import { CustomAlertModal, AlertState } from "../../utils/alert";

interface ClassSchedule {
  id: number;
  title: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function Dashboard() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const wide = width >= 700;

  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [addModal, setAddModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [addError, setAddError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const [editModal, setEditModal] = useState<boolean>(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ClassSchedule | null>(null);
  const [editedTitle, setEditedTitle] = useState<string>("");
  const [editError, setEditError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const [activatingId, setActivatingId] = useState<number | null>(null);

  const [alertConfig, setAlertConfig] = useState<AlertState>({
    visible: false,
    title: "",
    message: "",
  });

  const showAlert = (title: string, message?: string) => {
    setAlertConfig({ visible: true, title, message, type: "alert" });
  };

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    const { data, error } = await apiRequest<ClassSchedule[]>("/classes/");

    if (error) {
      showAlert("Error", error);
    } else if (data) {
      setSchedules(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const openAddModal = () => {
    setNewTitle("");
    setAddError(null);
    setAddModal(true);
  };

  const closeAddModal = () => {
    setAddModal(false);
    setAddError(null);
  };

  const openEditModal = (item: ClassSchedule) => {
    setSelectedSchedule(item);
    setEditedTitle(item.title);
    setEditError(null);
    setEditModal(true);
  };

  const closeEditModal = () => {
    setEditModal(false);
    setSelectedSchedule(null);
    setEditError(null);
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) {
      setAddError("Please enter a title for the schedule.");
      return;
    }

    setAddError(null);
    setIsCreating(true);

    const { data, error } = await apiRequest<ClassSchedule>("/classes/", {
      method: "POST",
      body: JSON.stringify({
        title: newTitle.trim(),
        is_active: true,
      }),
    });

    setIsCreating(false);

    if (error) {
      setAddError(error);
    } else if (data) {
      closeAddModal();
      fetchSchedules();
    }
  };

  const handleEdit = async () => {
    if (!selectedSchedule) return;
    if (!editedTitle.trim()) {
      setEditError("Please enter a title for the schedule.");
      return;
    }

    setEditError(null);
    setIsEditing(true);

    const { data, error } = await apiRequest<ClassSchedule>(`/classes/${selectedSchedule.id}/`, {
      method: "PATCH",
      body: JSON.stringify({
        title: editedTitle.trim(),
      }),
    });

    setIsEditing(false);

    if (error) {
      setEditError(error);
    } else if (data) {
      closeEditModal();
      fetchSchedules();
    }
  };

  const handleDelete = (id: number) => {
    showConfirm(
      "Delete Schedule",
      "Are you sure you want to delete this schedule?",
      async () => {
        const previousSchedules = [...schedules];
        setSchedules((prev) => prev.filter((item) => item.id !== id));

        const { error } = await apiRequest(`/classes/${id}/`, {
          method: "DELETE",
        });

        if (error) {
          showAlert("Delete Failed", error);
          setSchedules(previousSchedules);
        }

        fetchSchedules();
      },
      "Delete"
    );
  };

  const handleSetActive = async (id: number) => {
    setActivatingId(id);

    const { error } = await apiRequest<ClassSchedule>(`/classes/${id}/`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: true }),
    });

    setActivatingId(null);

    if (error) {
      showAlert("Failed to set active schedule", error);
    } else {
      fetchSchedules();
    }
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
                onPress={openAddModal}
              >
                <Feather name="plus" size={14} color="#14213D" />
                <Text className="text-brand-navy text-xs font-bold uppercase tracking-wider">
                  New Sched
                </Text>
              </Pressable>
            </View>

            <Text className="text-white text-xl font-black uppercase tracking-wide">
              Dashboard
            </Text>
          </View>
        </View>
        
        <View className="items-center py-6">
          <View style={{ width: "100%", maxWidth: width, paddingHorizontal: wide ? 32 : 24 }}>
            <View className="items-center mb-6">
              <Text className="text-brand-navy text-xs font-black uppercase tracking-widest mb-1">
                Saved Schedules ({schedules.length})
              </Text>
              <View className="w-8 h-0.5 bg-brand-gold rounded-full" />
            </View>

            {loading ? (
              <View className="py-12 items-center justify-center">
                <ActivityIndicator size="small" color="#14213D" />
              </View>
            ) : schedules.length === 0 ? (
              <View className="py-10 items-center justify-center rounded-2xl bg-brand-card border border-brand-hair p-6">
                <View className="w-10 h-10 rounded-full bg-brand-gold/20 items-center justify-center mb-3">
                  <Feather name="calendar" size={18} color="#C9A227" />
                </View>
                <Text className="text-brand-navy text-sm font-bold mb-1">No Schedules Found</Text>
                <Text className="text-brand-slate text-xs text-center">
                  Tap "New Sched" above to begin creating class schedules for this term.
                </Text>
              </View>
            ) : (
              <View className="gap-3">
                {schedules.map((item) => {
                  const isActive = item.is_active;
                  return (
                    <View
                      key={item.id}
                      className={`relative overflow-hidden rounded-2xl bg-brand-card border p-3 pl-5 shadow-xs transition-all active:scale-[0.98] ${
                        isActive
                          ? "border-brand-gold/60 shadow-sm"
                          : "border-brand-hair"
                      }`}
                    >
                      {isActive && (
                        <View className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-gold" />
                      )}
                      
                      <View className="flex-row items-center justify-between gap-3 mb-1.5">
                        <Text
                          className="text-base font-bold text-brand-navy flex-1 tracking-tight"
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>

                        {isActive ? (
                          <View className="flex-row items-center gap-1 bg-brand-gold px-2.5 py-1 rounded-full">
                            <Feather name="check-circle" size={10} color="#14213D" />
                            <Text className="text-[10px] text-brand-navy font-black uppercase tracking-wider">
                              Active
                            </Text>
                          </View>
                        ) : (
                          <Pressable
                            className="flex-row items-center gap-1 bg-white border border-brand-hair px-2.5 py-1 rounded-full active:bg-brand-hair/30"
                            onPress={() => handleSetActive(item.id)}
                            disabled={activatingId === item.id}
                            hitSlop={6}
                          >
                            {activatingId === item.id ? (
                              <ActivityIndicator size="small" color="#14213D" />
                            ) : (
                              <>
                                <Feather name="star" size={10} color="#5B6472" />
                                <Text className="text-[10px] text-brand-slate font-bold uppercase tracking-wider">
                                  Set Active
                                </Text>
                              </>
                            )}
                          </Pressable>
                        )}
                      </View>
                      
                      <View className="flex-row items-center gap-1.5 mb-3.5">
                        <Feather name="calendar" size={12} color="#5B6472" />
                        <Text className="text-brand-slate text-xs font-medium">
                          Created {formatDate(item.created_at)}
                        </Text>
                      </View>
                      
                      <View className="flex-row items-center justify-end gap-2 pt-3 border-t border-brand-hair/80">
                        {isActive && (
                          <Pressable
                            className="flex-row items-center gap-1.5 bg-white border border-brand-hair px-3.5 py-1.5 rounded-full active:bg-brand-hair/30"
                            onPress={() => router.push(`../(workspace)/schedule/${item.id}`)}
                            hitSlop={6}
                          >
                            <Feather name="eye" size={12} color="#14213D" />
                            <Text className="text-xs text-brand-navy font-bold uppercase tracking-wider">
                              View
                            </Text>
                          </Pressable>
                        )}

                        <Pressable
                          className="flex-row items-center gap-1.5 bg-white border border-brand-hair px-3.5 py-1.5 rounded-full active:bg-brand-hair/30"
                          onPress={() => openEditModal(item)}
                          hitSlop={6}
                        >
                          <Feather name="edit-2" size={12} color="#14213D" />
                          <Text className="text-xs text-brand-navy font-bold uppercase tracking-wider">
                            Edit
                          </Text>
                        </Pressable>

                        <Pressable
                          className="flex-row items-center gap-1.5 bg-brand-crimson/10 border border-brand-crimson/20 px-3.5 py-1.5 rounded-full active:bg-brand-crimson/20"
                          onPress={() => handleDelete(item.id)}
                          hitSlop={6}
                        >
                          <Feather name="trash-2" size={12} color="#8B1E3F" />
                          <Text className="text-xs text-brand-crimson font-bold uppercase tracking-wider">
                            Delete
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
        
        <Modal visible={addModal} transparent animationType="fade" onRequestClose={closeAddModal}>
          <View className="flex-1 justify-center items-center bg-brand-navy/60 px-6">
            <View className="w-full max-w-[360px] bg-white rounded-2xl p-5 border border-brand-hair">
              <Text className="text-brand-navy text-sm font-black uppercase tracking-widest mb-3">
                Create Schedule
              </Text>

              <TextInput
                className="bg-brand-card border border-brand-hair rounded-xl px-3.5 py-2.5 text-brand-navy text-xs font-medium mb-2"
                placeholder="Schedule Title (e.g., 1st Sem 2026)"
                placeholderTextColor="#A8ADB8"
                value={newTitle}
                onChangeText={(text) => {
                  setNewTitle(text);
                  if (addError) setAddError(null);
                }}
                autoFocus
              />

              {addError && <Text className="text-brand-crimson text-xs mb-2">{addError}</Text>}

              <View className="flex-row justify-end gap-2 mt-3">
                <Pressable
                  className="px-4 py-2 rounded-full border border-brand-hair bg-white"
                  onPress={closeAddModal}
                >
                  <Text className="text-brand-slate text-xs font-bold uppercase">Cancel</Text>
                </Pressable>

                <Pressable
                  className="px-4 py-2 rounded-full bg-brand-gold active:opacity-90 min-w-[70px] items-center"
                  onPress={handleCreate}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <ActivityIndicator size="small" color="#14213D" />
                  ) : (
                    <Text className="text-brand-navy text-xs font-black uppercase">Create</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={editModal} transparent animationType="fade" onRequestClose={closeEditModal}>
          <View className="flex-1 justify-center items-center bg-brand-navy/60 px-6">
            <View className="w-full max-w-[360px] bg-white rounded-2xl p-5 border border-brand-hair">
              <Text className="text-brand-navy text-xs font-black uppercase tracking-widest mb-3">
                Edit Schedule
              </Text>

              <TextInput
                className="bg-brand-card border border-brand-hair rounded-xl px-3.5 py-2.5 text-brand-navy text-xs font-medium mb-2"
                placeholder="Schedule Title"
                placeholderTextColor="#A8ADB8"
                value={editedTitle}
                onChangeText={(text) => {
                  setEditedTitle(text);
                  if (editError) setEditError(null);
                }}
                autoFocus
              />

              {editError && <Text className="text-brand-crimson text-xs mb-2">{editError}</Text>}

              <View className="flex-row justify-end gap-2 mt-3">
                <Pressable
                  className="px-4 py-2 rounded-full border border-brand-hair bg-white"
                  onPress={closeEditModal}
                >
                  <Text className="text-brand-slate text-xs font-bold uppercase">Cancel</Text>
                </Pressable>

                <Pressable
                  className="px-4 py-2 rounded-full bg-brand-gold active:opacity-90 min-w-[70px] items-center"
                  onPress={handleEdit}
                  disabled={isEditing}
                >
                  {isEditing ? (
                    <ActivityIndicator size="small" color="#14213D" />
                  ) : (
                    <Text className="text-brand-navy text-xs font-black uppercase">Save</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}