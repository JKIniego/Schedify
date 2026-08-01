import { useState, useRef } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { auth } from "../utils/auth";
import { storage } from "../utils/storage";

const features = [
  {
    icon: "calendar" as const,
    title: "Class Schedule",
    body: "Every class and room for the week, laid out the way your day actually runs.",
  },
  {
    icon: "check-square" as const,
    title: "Task Management",
    body: "Assignments sit right next to their corresponding class schedules.",
  },
  {
    icon: "bar-chart-2" as const,
    title: "Grade Calculator",
    body: "Set your course weights once and your average updates as scores come in.",
  },
];

export default function Index() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { width } = useWindowDimensions();
  const router = useRouter();
  const wide = width >= 700;
  const scrollViewRef = useRef<ScrollView>(null);
  const formPositionRef = useRef(0);

  const handleSubmit = async () => {
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      let result;

      if (mode === "login") {
        result = await auth.login(email, password);
      } else {
        result = await auth.register({
          username: name || email,
          email,
          password,
        });
      }

      const { data, error } = result;

      if (data?.access && data?.refresh) {
        await storage.setItem("access_token", data.access);
        await storage.setItem("refresh_token", data.refresh);
        router.replace("/dashboard");
        return;
      }

      if (error) {
        setErrorMsg(error);
        return;
      }

      setErrorMsg("Authentication failed. Please try again.");
    } catch {
      const storedToken = await storage.getItem("access_token");
      if (storedToken) {
        router.replace("/dashboard");
      } else {
        setErrorMsg("Unable to connect to server. Check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  const scrollToForm = (targetMode: "login" | "register") => {
    setMode(targetMode);
    setErrorMsg(null);
    if (scrollViewRef.current && formPositionRef.current > 0) {
      scrollViewRef.current.scrollTo({
        y: formPositionRef.current - 20,
        animated: true,
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <StatusBar style="light" />

      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 56 }}
      >
        <View className="bg-brand-navy w-full pt-4 pb-8 mb-4 items-center relative">
          <View style={{ width: "100%", maxWidth: 500, paddingHorizontal: wide ? 32 : 24 }}>
            <View className="flex-row items-center justify-between mb-8">
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-lg bg-brand-gold items-center justify-center">
                  <Text className="text-brand-navy text-base font-black">S</Text>
                </View>
                <Text className="text-white text-lg font-bold tracking-wide">SCHEDIFY</Text>
              </View>

              <View className="flex-row items-center gap-4">
                <Pressable onPress={() => scrollToForm("login")}>
                  <Text className="text-white/80 text-xs font-semibold uppercase tracking-wider">
                    Log In
                  </Text>
                </Pressable>
                <Pressable
                  className="bg-brand-gold px-3.5 py-1.5 rounded-full"
                  onPress={() => scrollToForm("register")}
                >
                  <Text className="text-brand-navy text-xs font-bold uppercase tracking-wider">
                    Sign Up
                  </Text>
                </Pressable>
              </View>
            </View>
            
            <View className="my-4">
              <Text className="text-white text-2xl md:text-3xl font-black uppercase tracking-wide leading-tight mb-3">
                Manage Your Semester Goals With Ease
              </Text>
              <Text className="text-white/80 text-xs md:text-sm leading-5 mb-6 max-w-[340px]">
                Organize your course schedule, track upcoming task deadlines, and keep your overall grades on target.
              </Text>
              
              <View className="flex-row gap-3 mb-4">
                <Pressable
                  className="bg-brand-gold px-5 py-2.5 rounded-full active:opacity-90"
                  onPress={() => scrollToForm("register")}
                >
                  <Text className="text-brand-navy text-xs font-black uppercase tracking-wider">
                    Get Started
                  </Text>
                </Pressable>
                <Pressable
                  className="bg-brand-crimson px-5 py-2.5 rounded-full active:opacity-90"
                  onPress={() => scrollToForm("login")}
                >
                  <Text className="text-white text-xs font-black uppercase tracking-wider">
                    Sign In
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
        
        <View className="items-center w-full mt-4">
          <View style={{ width: "100%", maxWidth: 500, paddingHorizontal: wide ? 32 : 24 }}>
            <View className="items-center mb-8">
              <Text className="text-brand-navy text-xs font-black uppercase tracking-widest mb-1">
                Overview & Features
              </Text>
              <View className="w-8 h-0.5 bg-brand-gold rounded-full" />
            </View>
            
            <View className="flex-row justify-between mb-10 gap-3">
              {features.map((f) => (
                <View key={f.title} className="flex-1 items-center text-center">
                  <View className="w-12 h-12 rounded-full bg-brand-card border border-brand-hair items-center justify-center mb-2">
                    <Feather name={f.icon} size={20} color="#C9A227" />
                  </View>
                  <Text className="text-brand-navy text-xs font-bold text-center mb-1">
                    {f.title}
                  </Text>
                  <Text className="text-brand-slate text-[10px] text-center leading-3">
                    {f.body}
                  </Text>
                </View>
              ))}
            </View>
            
            <View className="items-center mb-6">
              <Text className="text-brand-navy text-xs font-black uppercase tracking-widest mb-1">
                Access Your Account
              </Text>
              <View className="w-8 h-0.5 bg-brand-gold rounded-full" />
            </View>
            
            <View
              className="bg-brand-card border border-brand-hair rounded-2xl p-5 shadow-xs"
              onLayout={(event) => {
                formPositionRef.current = event.nativeEvent.layout.y;
              }}
            >
              <View className="bg-white border border-brand-hair p-1 rounded-full flex-row mb-5">
                <Pressable
                  onPress={() => {
                    setMode("login");
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-2 rounded-full items-center ${
                    mode === "login" ? "bg-brand-navy" : "bg-transparent"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold uppercase tracking-wider ${
                      mode === "login" ? "text-white" : "text-brand-slate"
                    }`}
                  >
                    Log In
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setMode("register");
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-2 rounded-full items-center ${
                    mode === "register" ? "bg-brand-navy" : "bg-transparent"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold uppercase tracking-wider ${
                      mode === "register" ? "text-white" : "text-brand-slate"
                    }`}
                  >
                    Register
                  </Text>
                </Pressable>
              </View>

              {errorMsg && (
                <View className="bg-brand-crimson/10 border border-brand-crimson/20 rounded-xl p-3 mb-4">
                  <Text className="text-brand-crimson text-xs font-medium text-center">
                    {errorMsg}
                  </Text>
                </View>
              )}

              {mode === "register" && (
                <View className="mb-3">
                  <Text className="text-brand-slate text-xs font-bold uppercase tracking-wider mb-1 ml-1">
                    Name
                  </Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Juan Dela Cruz"
                    placeholderTextColor="#A8ADB8"
                    className="border border-brand-hair text-brand-navy rounded-xl px-4 py-2.5 text-xs bg-white"
                  />
                </View>
              )}

              <View className="mb-3">
                <Text className="text-brand-slate text-xs font-bold uppercase tracking-wider mb-1 ml-1">
                  Email Address
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="student@example.com"
                  placeholderTextColor="#A8ADB8"
                  className="border border-brand-hair text-brand-navy rounded-xl px-4 py-2.5 text-xs bg-white"
                />
              </View>

              <View className="mb-5">
                <Text className="text-brand-slate text-xs font-bold uppercase tracking-wider mb-1 ml-1">
                  Password
                </Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#A8ADB8"
                  secureTextEntry
                  className="border border-brand-hair text-brand-navy rounded-xl px-4 py-2.5 text-xs bg-white"
                />
              </View>

              <Pressable
                disabled={loading}
                className="bg-brand-gold rounded-full py-3 items-center justify-center active:opacity-90"
                onPress={handleSubmit}
              >
                {loading ? (
                  <ActivityIndicator color="#14213D" size="small" />
                ) : (
                  <Text className="text-brand-navy text-xs font-black uppercase tracking-wider">
                    {mode === "login" ? "Sign In" : "Create Account"}
                  </Text>
                )}
              </Pressable>
            </View>

            <View className="flex-row items-center justify-center gap-1.5 mt-6">
              <Feather name="wifi-off" size={12} color="#5B6472" />
              <Text className="text-brand-slate text-xs">
                Works completely offline on your device.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}