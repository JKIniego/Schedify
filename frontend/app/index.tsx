import { useState, useRef } from "react";
import { Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from "react-native";
import Svg, { Ellipse, Path } from "react-native-svg";
import { Feather } from "@expo/vector-icons";
import { useRouter } from 'expo-router';

const NAVY = "#14213D";
const GOLD = "#C9A227";
const CRIMSON = "#8B1E3F";
const SLATE = "#5B6472";
const HAIR = "#E4E1D8";
const CARD = "#FBFAF7";

const DAYS = ["M", "T", "W", "T", "F"];

function GoldUnderline({ width = 150 }: { width?: number }) {
  return (
    <Svg width={width} height={10} viewBox={`0 0 ${width} 10`} style={{ marginTop: -6 }}>
      <Path
        d={`M2 5 Q ${width / 2} 9 ${width - 2} 4`}
        stroke={GOLD}
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function GradeBadge() {
  return (
    <View className="w-[74px] h-[62px] items-center justify-center">
      <Svg width={74} height={62} viewBox="0 0 74 62" style={{ position: "absolute" }}>
        <Ellipse cx={37} cy={31} rx={32} ry={24} stroke={CRIMSON} strokeWidth={2} fill="white" />
      </Svg>
      <Text style={{ color: CRIMSON }} className="text-lg font-extrabold">
        1.25
      </Text>
    </View>
  );
}

function WeekPreview() {
  return (
    <View className="relative w-full items-center py-3">
      <View
        style={{ borderColor: NAVY, borderWidth: 1.5 }}
        className="w-full max-w-xs rounded-lg bg-white p-4"
      >
        <View className="flex-row items-center justify-between mb-3">
          <Text
            style={{ color: SLATE, letterSpacing: 1 }}
            className="text-[11px] font-bold uppercase"
          >
            This Week
          </Text>
          <View style={{ backgroundColor: GOLD }} className="w-1.5 h-1.5 rounded-full" />
        </View>

        <View className="flex-row justify-between mb-2">
          {DAYS.map((d, i) => (
            <Text key={i} style={{ color: SLATE }} className="text-[11px] font-semibold w-8 text-center">
              {d}
            </Text>
          ))}
        </View>

        {[0, 1, 2].map((row) => (
          <View key={row} className="flex-row justify-between mb-2">
            {DAYS.map((_, col) => {
              const filled = (row + col) % 3 !== 0;
              const active = row === 1 && col === 2;
              return (
                <View
                  key={col}
                  style={{ backgroundColor: active ? NAVY : filled ? "#EEF0F4" : "transparent" }}
                  className="w-8 h-6 rounded-[3px]"
                />
              );
            })}
          </View>
        ))}

        <View style={{ borderTopColor: HAIR, borderTopWidth: 1 }} className="mt-3 pt-3">
          <View className="flex-row items-center gap-2">
            <Feather name="check-circle" size={13} color={NAVY} />
            <Text style={{ color: NAVY }} className="text-xs font-medium flex-1" numberOfLines={1}>
              Problem Set 4 — due Fri
            </Text>
          </View>
        </View>
      </View>

      <View className="absolute -top-1 -right-2">
        <GradeBadge />
      </View>
    </View>
  );
}

function Divider() {
  return (
    <View className="flex-row items-center justify-center py-9">
      <View style={{ backgroundColor: HAIR }} className="flex-1 h-[1px]" />
      <View style={{ borderColor: GOLD, borderWidth: 1.5 }} className="w-2 h-2 rounded-full mx-3" />
      <View style={{ backgroundColor: HAIR }} className="flex-1 h-[1px]" />
    </View>
  );
}

const features = [
  {
    icon: "calendar" as const,
    color: NAVY,
    title: "Class schedule",
    body: "Every class and room for the week, laid out the way your day actually runs.",
  },
  {
    icon: "check-square" as const,
    color: CRIMSON,
    title: "Task list",
    body: "Assignments sit next to the class they belong to, not in a separate app.",
  },
  {
    icon: "bar-chart-2" as const,
    color: GOLD,
    title: "Grade calculator",
    body: "Set your weights once — your running average updates as scores come in.",
  },
];

export default function Index() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const { width } = useWindowDimensions();
  const router = useRouter();
  const wide = width >= 700;
  const scrollViewRef = useRef<ScrollView>(null);
  const formPositionRef = useRef(0);
  
  const handleLogin = () => {
    router.push('/dashboard');
  }

  const scrollToForm = (targetMode: "login" | "register") => {
    setMode(targetMode);
    if (scrollViewRef.current && formPositionRef.current > 0) {
      scrollViewRef.current.scrollTo({
        y: formPositionRef.current - 50,
        animated: true,
      });
    }
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        contentContainerStyle={{ alignItems: "center", paddingTop: 64, paddingBottom: 56 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: "100%", maxWidth: 480, paddingHorizontal: wide ? 32 : 24 }}>
          <View className="flex-row items-center justify-between mb-10">
            <View className="flex-row items-center gap-2.5">
              {/* drop your logo image here once it's ready */}
              <View
                style={{ borderColor: NAVY, borderWidth: 1.5 }}
                className="w-9 h-9 rounded-md items-center justify-center"
              >
                <Text style={{ color: NAVY }} className="text-sm font-bold">
                  S
                </Text>
              </View>
              <Text style={{ color: NAVY }} className="text-lg font-bold">
                Schedify
              </Text>
            </View>
            <View
              style={{ borderColor: HAIR, borderWidth: 1 }}
              className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
            >
              <Feather name="wifi-off" size={11} color={NAVY} />
              <Text style={{ color: SLATE }} className="text-xs font-medium">
                Works offline
              </Text>
            </View>
          </View>

          <Text style={{ color: NAVY }} className="text-[32px] leading-[40px] font-extrabold mb-1">
            Your semester,{"\n"}on one
          </Text>
          <View className="mb-4">
            <Text style={{ color: NAVY }} className="text-[32px] leading-[40px] font-extrabold">
              timetable.
            </Text>
            <GoldUnderline width={148} />
          </View>
          <Text style={{ color: SLATE }} className="text-base leading-6 mb-8 max-w-[300px]">
            Classes, tasks, and grades in the same grid — synced when you're
            online, untouched when you're not.
          </Text>

          <WeekPreview />

          <View className="mt-10">
            <Pressable style={{ backgroundColor: NAVY }} className="rounded-md py-3.5 items-center" onPress={() => scrollToForm("register")}>
              <Text style={{ color: "white", letterSpacing: 0.5 }} className="text-sm font-bold">
                Get Started
              </Text>
            </Pressable>
            <Pressable className="items-center mt-4" onPress={() => scrollToForm("login")}>
              <Text style={{ color: SLATE }} className="text-sm">
                Already enrolled?{" "}
                <Text style={{ color: CRIMSON }} className="font-semibold">
                  Log in
                </Text>
              </Text>
            </Pressable>
          </View>

          <Divider />

          <Text style={{ color: NAVY }} className="text-2xl font-bold text-center mb-2">
            Built for the semester
          </Text>
          <Text style={{ color: SLATE }} className="text-sm text-center mb-8 leading-5">
            Three things that used to live in three apps, now on one page.
          </Text>

          <View className="flex-row flex-wrap" style={{ gap: 12 }}>
            {features.map((f) => (
              <View
                key={f.title}
                style={{
                  backgroundColor: CARD,
                  borderColor: HAIR,
                  borderWidth: 1,
                  flexBasis: wide ? "31%" : "47%",
                  flexGrow: 1,
                }}
                className="rounded-lg p-4"
              >
                <View
                  style={{ borderColor: f.color, borderWidth: 1.5 }}
                  className="w-9 h-9 rounded-full items-center justify-center mb-3"
                >
                  <Feather name={f.icon} size={15} color={f.color} />
                </View>
                <Text style={{ color: NAVY }} className="text-sm font-bold mb-1">
                  {f.title}
                </Text>
                <Text style={{ color: SLATE }} className="text-xs leading-5">
                  {f.body}
                </Text>
              </View>
            ))}
          </View>

          <Divider />

          <View style={{ borderColor: HAIR, borderWidth: 1 }} className="bg-white rounded-xl p-5" onLayout={(event) => { formPositionRef.current = event.nativeEvent.layout.y; }}>
            <View style={{ backgroundColor: "#F3F1EA" }} className="flex-row rounded-full p-1 mb-5">
              <Pressable
                onPress={() => setMode("login")}
                style={{ backgroundColor: mode === "login" ? NAVY : "transparent" }}
                className="flex-1 py-2 rounded-full items-center"
              >
                <Text style={{ color: mode === "login" ? "white" : SLATE }} className="text-sm font-semibold">
                  Log in
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setMode("register")}
                style={{ backgroundColor: mode === "register" ? NAVY : "transparent" }}
                className="flex-1 py-2 rounded-full items-center"
              >
                <Text style={{ color: mode === "register" ? "white" : SLATE }} className="text-sm font-semibold">
                  Register
                </Text>
              </Pressable>
            </View>

            {mode === "register" && (
              <View className="mb-3">
                <Text style={{ color: SLATE }} className="text-sm font-medium mb-1.5 ml-1">
                  Name
                </Text>
                <TextInput
                  placeholder="Juan Dela Cruz"
                  placeholderTextColor="#A8ADB8"
                  style={{ borderColor: HAIR, borderWidth: 1, color: NAVY }}
                  className="rounded-lg px-4 py-3 text-sm bg-white"
                />
              </View>
            )}

            <View className="mb-3">
              <Text style={{ color: SLATE }} className="text-sm font-medium mb-1.5 ml-1">
                Email
              </Text>
              <TextInput
                placeholder="you@example.com"
                placeholderTextColor="#A8ADB8"
                style={{ borderColor: HAIR, borderWidth: 1, color: NAVY }}
                className="rounded-lg px-4 py-3 text-sm bg-white"
              />
            </View>

            <View className="mb-5">
              <Text style={{ color: SLATE }} className="text-sm font-medium mb-1.5 ml-1">
                Password
              </Text>
              <TextInput
                placeholder="••••••••"
                placeholderTextColor="#A8ADB8"
                secureTextEntry
                style={{ borderColor: HAIR, borderWidth: 1, color: NAVY }}
                className="rounded-lg px-4 py-3 text-sm bg-white"
              />
            </View>

            <Pressable
              style={{ backgroundColor: NAVY }}
              className="rounded-lg py-3.5 items-center"
              onPress={() => { mode === "login" ? handleLogin() : '' }}
            >
              <Text style={{ color: "white" }} className="text-sm font-bold">
                {mode === "login" ? "Log in" : "Create account"}
              </Text>
            </Pressable>
          </View>

          <Text style={{ color: "#A8ADB8" }} className="text-xs text-center mt-8 leading-4">
            No connection needed — your schedule lives on your device first.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}