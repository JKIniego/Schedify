import { ScrollView, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

export default function Profile() {
  const { width } = useWindowDimensions();
  const wide = width >= 700;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <StatusBar style="dark" />

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
          </View>
          
          <Text className="text-brand-navy text-[28px] leading-[34px] font-extrabold mb-4">
            Profile
          </Text>

          <View className="rounded-xl p-5 bg-brand-card border border-brand-hair gap-2">
            <Text className="text-brand-navy font-bold text-base">Sample Profile Page</Text>
            <Text className="text-brand-slate text-sm leading-5">
              This is a separate profile screen. You can add your profile details here.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}