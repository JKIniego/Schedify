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

const GWA = {
  gwa: 1.092,
};

const COURSES = [
  {
    id: 1,
    course: "CMSC 192",
    units: 3,
    grade: 1.75,
  },
  {
    id: 2,
    course: "CMSC 170",
    units: 3,
    grade: 1.25,
  },
  {
    id: 3,
    course: "CMSC 128",
    units: 3,
    grade: 1.0,
  },
  {
    id: 4,
    course: "STAT 101",
    units: 3,
    grade: 1.5,
  },
];

export default function Grades() {
  const { id } = useLocalSearchParams<{ id: string }>(); 
  const { width } = useWindowDimensions();
  const wide = width >= 700;
  
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(1);

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
            
            <View className="bg-white/10 rounded-2xl p-5 border border-white/15 backdrop-blur-md">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-white/80 text-xs font-bold uppercase tracking-widest">
                  General Weighted Average
                </Text>
              </View>

              <View className="flex-row items-baseline gap-2">
                <Text className="text-brand-gold text-4xl font-black tracking-tight">
                  {GWA.gwa.toFixed(3)}
                </Text>
              </View>

              <View className="flex-row items-center justify-between mt-4 pt-3 border-t border-white/10">
                <View className="flex-row items-center gap-1.5">
                  <Feather name="book-open" size={13} color="#C9A227" />
                  <Text className="text-white/80 text-xs font-semibold">
                    {COURSES.length} Courses Recorded
                  </Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <Feather name="check-circle" size={13} color="#4ADE80" />
                  <Text className="text-white/80 text-xs font-semibold">
                    12 Units Completed
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
        
        <View className="items-center py-6">
          <View style={{ width: "100%", maxWidth: width, paddingHorizontal: wide ? 32 : 24 }}>
            <View className="items-center mb-4 z-0" style={{ zIndex: 0 }}>
              <Text className="text-brand-navy text-[11px] font-black uppercase tracking-widest mb-1">
                Enrolled Courses ({COURSES.length})
              </Text>
              <View className="w-8 h-0.5 bg-brand-gold rounded-full" />
            </View>

            <View className="gap-3">
              {COURSES.map((item) => {
                const isSelected = selectedCourseId === item.id;

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setSelectedCourseId(isSelected ? null : item.id)}
                    className={`relative overflow-hidden rounded-2xl bg-brand-card border p-4 transition-all active:scale-[0.99] ${
                      isSelected
                        ? "border-brand-gold/60 shadow-xs"
                        : "border-brand-hair"
                    }`}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1 pr-3">
                        <View className="flex-row items-center gap-2 mb-1">
                          <Text className="text-brand-navy font-black text-sm tracking-wide">
                            {item.course}
                          </Text>
                          <Text className="text-brand-slate text-xs font-medium">
                            • {item.units} Units
                          </Text>
                        </View>
                      </View>
                      
                      <View className="bg-brand-navy/5 border border-brand-navy/10 px-3 py-1.5 rounded-xl items-center">
                        <Text className="text-brand-navy font-black text-base">
                          {item.grade.toFixed(2)}
                        </Text>
                        <Text className="text-brand-slate text-[9px] font-bold uppercase tracking-wider">
                          Grade
                        </Text>
                      </View>
                    </View>
                    
                    {isSelected && (
                      <View className="mt-3 pt-3 border-t border-brand-hair/80 flex-row items-center justify-between">
                        <View className="flex-row items-center gap-1.5">
                          <Feather name="award" size={12} color="#14213D" />
                          <Text className="text-brand-navy text-xs font-bold">
                            Passed
                          </Text>
                        </View>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}