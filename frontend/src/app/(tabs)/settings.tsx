import { ScrollView, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

export default function Settings() {
  const { width } = useWindowDimensions();
  const wide = width >= 700;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <StatusBar style="light" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="bg-brand-navy pt-4 pb-8 items-center">
          <View style={{ width: "100%", maxWidth: 480, paddingHorizontal: wide ? 32 : 24 }}>
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-lg bg-brand-gold items-center justify-center">
                  <Text className="text-brand-navy text-base font-black">S</Text>
                </View>
                <Text className="text-white text-lg font-bold tracking-wide">SCHEDIFY</Text>
              </View>
            </View>

            <Text className="text-white text-xl font-black uppercase tracking-wide">
              Settings
            </Text>
          </View>
        </View>
        
        <View className="items-center py-6">
          <View style={{ width: "100%", maxWidth: 480, paddingHorizontal: wide ? 32 : 24 }}>
            <View className="items-center mb-6">
              <Text className="text-brand-navy text-xs font-black uppercase tracking-widest mb-1">
                Preferences
              </Text>
              <View className="w-8 h-0.5 bg-brand-gold rounded-full" />
            </View>

            <View className="rounded-2xl p-5 bg-brand-card border border-brand-hair gap-2 shadow-xs">
              <Text className="text-brand-navy font-bold text-base">Sample Settings Page</Text>
              <Text className="text-brand-slate text-sm leading-5">
                This is a separate settings screen. You can add your app configuration, preferences, profile controls, and account management tools here.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}