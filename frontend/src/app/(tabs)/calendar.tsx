import React, { useState } from "react";
import { ScrollView, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Calendar as RNCalendar, DateData } from "react-native-calendars";
import { Feather } from "@expo/vector-icons";

export default function Calendar() {
  const { width } = useWindowDimensions();
  const wide = width >= 700;
  
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
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
            </View>

            <Text className="text-brand-gold text-xs font-black uppercase tracking-widest text-center">
              Schedule & Events
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
                <Text className="text-white text-2xl font-black">0</Text>
                <Text className="text-white/80 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                  Events
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        <View className="items-center py-6">
          <View style={{ width: "100%", maxWidth: width, paddingHorizontal: wide ? 32 : 24 }}>
            <View className="rounded-2xl bg-brand-card border border-brand-hair p-2 overflow-hidden shadow-xs mb-6">
              <RNCalendar
                onDayPress={handleDayPress}
                markedDates={{
                  [selectedDate]: {
                    selected: true,
                    selectedColor: "#14213D",
                    selectedTextColor: "#FCA311",
                  },
                }}
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
                Agenda for {selectedDate}
              </Text>
              <View className="w-8 h-0.5 bg-brand-gold rounded-full" />
            </View>
            
            <View className="rounded-2xl p-5 bg-brand-card border border-brand-hair gap-2 shadow-xs items-center justify-center py-8">
              <Feather name="calendar" size={24} color="#5B6472" />
              <Text className="text-brand-slate text-xs font-medium text-center mt-1">
                No events scheduled for this day.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}