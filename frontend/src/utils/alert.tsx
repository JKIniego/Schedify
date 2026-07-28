import React from "react";
import { Modal, Text, View, Pressable } from "react-native";

export interface AlertState {
  visible: boolean;
  title: string;
  message?: string;
  type?: "alert" | "confirm";
  onConfirm?: () => void;
  confirmText?: string;
}

interface CustomAlertProps {
  state: AlertState;
  onClose: () => void;
}

export function CustomAlertModal({ state, onClose }: CustomAlertProps) {
  const { visible, title, message, type = "alert", onConfirm, confirmText = "Confirm" } = state;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center bg-black/50 px-6">
        <View className="w-full max-w-[380px] bg-white rounded-2xl p-6 border border-brand-hair shadow-lg">
          <Text className="text-brand-navy text-lg font-bold mb-2">{title}</Text>

          {message ? (
            <Text className="text-brand-slate text-sm font-medium mb-6 leading-5">
              {message}
            </Text>
          ) : null}

          <View className="flex-row justify-end gap-3 mt-2">
            {type === "confirm" && (
              <Pressable
                className="px-4 py-2.5 rounded-xl border border-brand-hair bg-white active:bg-gray-50"
                onPress={onClose}
              >
                <Text className="text-brand-slate text-xs font-bold">Cancel</Text>
              </Pressable>
            )}

            <Pressable
              className={`px-4 py-2.5 rounded-xl active:opacity-90 min-w-[80px] items-center justify-center ${
                type === "confirm" ? "bg-brand-crimson" : "bg-brand-navy"
              }`}
              onPress={() => {
                onClose();
                if (onConfirm) onConfirm();
              }}
            >
              <Text className="text-white text-xs font-bold">
                {type === "confirm" ? confirmText : "OK"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}