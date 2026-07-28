import { useState, useEffect, useCallback } from "react";
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
    return (
      date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }) +
      " • " +
      date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  const fetchSchedules = useCallback(async () => {
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

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <StatusBar style="dark" />
      <CustomAlertModal
        state={alertConfig}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ alignItems: "center", paddingTop: 24, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: "100%", maxWidth: 480, paddingHorizontal: wide ? 32 : 24 }}>
          <View className="flex-row items-center justify-between mb-8">
            <View className="flex-row items-center gap-2.5">
              <View className="w-9 h-9 rounded-md items-center justify-center border-[1.5px] border-brand-navy">
                <Text className="text-brand-navy text-sm font-bold">S</Text>
              </View>
              <Text className="text-brand-navy text-lg font-bold">Schedify</Text>
            </View>

            <View className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5 border border-brand-hair bg-brand-card">
              <Feather name="calendar" size={12} color="#14213D" />
              <Text className="text-brand-slate text-xs font-semibold">
                {schedules.length} Timetables
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between mb-8">
            <Text className="text-brand-navy text-[28px] leading-[34px] font-extrabold">
              Dashboard
            </Text>

            <Pressable
              className="bg-brand-navy rounded-xl py-2.5 px-3.5 flex-row items-center gap-1.5 active:opacity-90"
              onPress={openAddModal}
            >
              <Feather name="plus-circle" size={15} color="white" />
              <Text className="text-white text-xs font-bold">Create Sched</Text>
            </Pressable>
          </View>

          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-brand-navy text-xs font-extrabold uppercase tracking-widest">
              Saved Schedules
            </Text>
          </View>

          {loading ? (
            <View className="py-12 items-center justify-center">
              <ActivityIndicator size="large" color="#14213D" />
            </View>
          ) : schedules.length === 0 ? (
            <View className="py-12 items-center justify-center rounded-xl bg-brand-card border border-brand-hair p-6">
              <Feather name="calendar" size={32} color="#5B6472" />
              <Text className="text-brand-navy text-base font-bold mt-3 mb-1">
                No schedules found
              </Text>
              <Text className="text-brand-slate text-xs text-center">
                Tap "Create Sched" above to start adding your weekly class schedules.
              </Text>
            </View>
          ) : (
            <View className="gap-3.5">
              {schedules.map((item) => (
                <View
                  key={item.id}
                  className="rounded-xl p-4 bg-brand-card border border-brand-hair"
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-base text-brand-navy font-bold flex-1 mr-2" numberOfLines={1}>
                      {item.title}
                    </Text>

                    {item.is_active && (
                      <View className="bg-brand-gold/15 border border-brand-gold/40 px-2 py-0.5 rounded-full">
                        <Text className="text-[10px] text-brand-navy font-extrabold uppercase">
                          Current
                        </Text>
                      </View>
                    )}
                  </View>

                  <View className="flex-row items-center gap-1.5 mb-3">
                    <Feather name="clock" size={12} color="#5B6472" />
                    <Text className="text-xs text-brand-slate font-medium">
                      Created: <Text className="text-brand-navy font-semibold">{formatDate(item.created_at)}</Text>
                    </Text>
                  </View>

                  <View className="h-[1px] bg-brand-hair mb-3" />

                  <View className="flex-row items-center justify-end gap-2">
                    <Pressable
                      className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-brand-hair active:bg-gray-50"
                      onPress={() => openEditModal(item)}
                    >
                      <Feather name="edit-2" size={13} color="#14213D" />
                      <Text className="text-xs text-brand-navy font-semibold">Edit</Text>
                    </Pressable>

                    <Pressable
                      className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-brand-hair active:bg-red-50"
                      onPress={() => handleDelete(item.id)}
                    >
                      <Feather name="trash-2" size={13} color="#8B1E3F" />
                      <Text className="text-xs text-brand-crimson font-semibold">Delete</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
        
        <Modal
          visible={addModal}
          transparent
          animationType="fade"
          onRequestClose={closeAddModal}
        >
          <View className="flex-1 justify-center items-center bg-black/50 px-6">
            <View className="w-full max-w-[400px] bg-white rounded-2xl p-6 border border-brand-hair">
              <Text className="text-brand-navy text-xl font-bold mb-4">
                Create New Schedule
              </Text>

              <Text
                className={`${
                  addError ? "text-brand-crimson" : "text-brand-slate"
                } text-xs font-bold mb-1.5 uppercase`}
              >
                Schedule Title
              </Text>
              <TextInput
                className={`bg-brand-card border rounded-xl px-4 py-3 text-brand-navy text-sm font-medium ${
                  addError ? "border-brand-crimson" : "border-brand-hair"
                }`}
                placeholder="e.g. A.Y. 2026-2027 1st Sem"
                placeholderTextColor="#94A3B8"
                value={newTitle}
                onChangeText={(text) => {
                  setNewTitle(text);
                  if (addError) setAddError(null);
                }}
                autoFocus
              />
              
              {addError ? (
                <Text className="text-brand-crimson text-xs font-medium mt-1.5 mb-4">
                  {addError}
                </Text>
              ) : (
                <View className="mb-6" />
              )}

              <View className="flex-row justify-end gap-3">
                <Pressable
                  className="px-4 py-2.5 rounded-xl border border-brand-hair bg-white active:bg-gray-50"
                  onPress={closeAddModal}
                >
                  <Text className="text-brand-slate text-xs font-bold">Cancel</Text>
                </Pressable>

                <Pressable
                  className="px-4 py-2.5 rounded-xl bg-brand-navy active:opacity-90 flex-row items-center justify-center min-w-[80px]"
                  onPress={handleCreate}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white text-xs font-bold">Create</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
        
        <Modal
          visible={editModal}
          transparent
          animationType="fade"
          onRequestClose={closeEditModal}
        >
          <View className="flex-1 justify-center items-center bg-black/50 px-6">
            <View className="w-full max-w-[400px] bg-white rounded-2xl p-6 border border-brand-hair">
              <Text className="text-brand-navy text-xl font-bold mb-4">
                Edit Schedule
              </Text>

              <Text
                className={`${
                  editError ? "text-brand-crimson" : "text-brand-slate"
                } text-xs font-bold mb-1.5 uppercase`}
              >
                Schedule Title
              </Text>
              <TextInput
                className={`bg-brand-card border rounded-xl px-4 py-3 text-brand-navy text-sm font-medium ${
                  editError ? "border-brand-crimson" : "border-brand-hair"
                }`}
                placeholder="e.g. A.Y. 2026-2027 1st Sem"
                placeholderTextColor="#94A3B8"
                value={editedTitle}
                onChangeText={(text) => {
                  setEditedTitle(text);
                  if (editError) setEditError(null);
                }}
                autoFocus
              />
              
              {editError ? (
                <Text className="text-brand-crimson text-xs font-medium mt-1.5 mb-4">
                  {editError}
                </Text>
              ) : (
                <View className="mb-6" />
              )}

              <View className="flex-row justify-end gap-3">
                <Pressable
                  className="px-4 py-2.5 rounded-xl border border-brand-hair bg-white active:bg-gray-50"
                  onPress={closeEditModal}
                >
                  <Text className="text-brand-slate text-xs font-bold">Cancel</Text>
                </Pressable>

                <Pressable
                  className="px-4 py-2.5 rounded-xl bg-brand-navy active:opacity-90 flex-row items-center justify-center min-w-[80px]"
                  onPress={handleEdit}
                  disabled={isEditing}
                >
                  {isEditing ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white text-xs font-bold">Save</Text>
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