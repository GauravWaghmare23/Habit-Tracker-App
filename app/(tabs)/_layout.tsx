import { Tabs } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { StyleSheet, Animated, Easing } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useRef, useEffect } from "react";

const AnimatedFontAwesome = Animated.createAnimatedComponent(FontAwesome);
const AnimatedText = Animated.createAnimatedComponent(({ style, children }) => (
  <Animated.Text style={style}>{children}</Animated.Text>
));

function AnimatedTabIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  const scale = useRef(new Animated.Value(focused ? 1.15 : 1)).current;

  useEffect(() => {
    Animated.timing(scale, {
      toValue: focused ? 1.15 : 1,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [focused]);

  return (
    <AnimatedFontAwesome
      name={name}
      size={24}
      color={color}
      style={[styles.icon, { transform: [{ scale }], marginBottom: 6 }]}
    />
  );
}

function AnimatedTabLabel({ label, color, focused }: { label: string; color: string; focused: boolean }) {
  const opacity = useRef(new Animated.Value(focused ? 1 : 0.5)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: focused ? 1 : 0.5,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [focused]);

  return (
    <AnimatedText style={[styles.label, { color, opacity }]}>
      {label}
    </AnimatedText>
  );
}

export default function RootLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: [
          styles.tabBar,
          { paddingBottom: insets.bottom, height: 65 + insets.bottom },
        ],
        tabBarActiveTintColor: "#7c49fb",
        tabBarInactiveTintColor: "#a1a1aa",
        tabBarLabelStyle: styles.label,
        headerShown: false,
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today's Habit",
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon name="calendar" color={color} focused={focused} />
          ),
          tabBarLabel: ({ color, focused }) => (
            <AnimatedTabLabel label="Today's Habit" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="Streaks"
        options={{
          title: "Streaks",
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon name="star" color={color} focused={focused} />
          ),
          tabBarLabel: ({ color, focused }) => (
            <AnimatedTabLabel label="Streaks" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="AddHabit"
        options={{
          title: "Add Habits",
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon name="plus" color={color} focused={focused} />
          ),
          tabBarLabel: ({ color, focused }) => (
            <AnimatedTabLabel label="Add Habits" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#fafaff",
    borderTopWidth: 0,
    elevation: 10,
    shadowColor: "#7c49fb",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    height: 65,
    paddingBottom: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    color: "#7c49fb",
  },
  icon: {
    marginBottom: 6,
  },
});
