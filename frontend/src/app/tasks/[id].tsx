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
import { apiRequest } from "../../utils/api";
import { CustomAlertModal, AlertState } from "../../utils/alert";

export default function Task() {
  const { id: taskId } = useLocalSearchParams();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const wide = width >= 700;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <StatusBar style="light" />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
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
              Course Name
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}