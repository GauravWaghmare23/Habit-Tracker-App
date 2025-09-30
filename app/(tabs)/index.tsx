import { database, client, DATABASE_ID, HABITS_COLLECTION_ID } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { Habit } from "@/types/database.type";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, View, StyleSheet, RefreshControl, Pressable } from "react-native";
import { Query } from "react-native-appwrite";
import { Button, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function Index() {
  const { logout, user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchHabits();
      // Setup realtime subscription on user's habits
      const unsubscribe = client.subscribe(
        [`databases.${DATABASE_ID}.collections.${HABITS_COLLECTION_ID}.documents`],
        (resp: any) => {
          // Only update if document is for this user
          const payload: Habit = resp.payload;
          if (payload.user_id === user.$id) {
            fetchHabits();
          }
        }
      );
      return () => {
        unsubscribe();
      };
    } else {
      setHabits([]);
    }
  }, [user]);

  const fetchHabits = async () => {
    setLoading(true);
    try {
      const response = await database.listDocuments(
        DATABASE_ID as string,
        HABITS_COLLECTION_ID as string,
        [Query.equal("user_id", user?.$id ?? "")]
      );
      setHabits(response.documents as unknown as Habit[]);
    } catch {
      Alert.alert("Error", "Failed to fetch habits");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      Alert.alert("Logged out successfully");
    } catch (error) {
      Alert.alert("Logout failed", error instanceof Error ? error.message : "Unknown error");
    }
  };

  // Checks if current habit is completed today
  const isCompletedToday = (habit: Habit) => {
    const now = new Date();
    const lastCompleted = new Date(habit.last_completed);
    return (
      now.getFullYear() === lastCompleted.getFullYear() &&
      now.getMonth() === lastCompleted.getMonth() &&
      now.getDate() === lastCompleted.getDate()
    );
  };

  const onCompleteHabit = async (habit: Habit) => {
    try {
      const now = new Date();
      const lastCompleted = new Date(habit.last_completed);
      const diffDays = Math.floor(
        (now.getTime() - lastCompleted.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Only increment streak if user hasn't completed today
      let newStreak = habit.streak_count;
      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      } else if (diffDays === 0) {
        Alert.alert("Info", "Habit already completed today.");
        return;
      }

      await database.updateDocument(
        DATABASE_ID as string,
        HABITS_COLLECTION_ID as string,
        habit.$id,
        {
          streak_count: newStreak,
          last_completed: now.toISOString(),
        }
      );
      fetchHabits();
    } catch {
      Alert.alert("Error", "Failed to update habit");
    }
  };

  const onDeleteHabit = (habit: Habit) => {
    Alert.alert(
      "Delete Habit",
      `Are you sure you want to delete "${habit.title}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await database.deleteDocument(
                DATABASE_ID as string,
                HABITS_COLLECTION_ID as string,
                habit.$id,
              );
              fetchHabits();
            } catch {
              Alert.alert("Error", "Failed to delete habit");
            }
          },
        },
      ]
    );
  };

  const renderHabit = ({ item }: { item: Habit }) => {
    const completed = isCompletedToday(item);
    return (
      <View style={[styles.card, completed && styles.completedCard]}>
        <Text style={styles.habitTitle}>{item.title}</Text>
        <Text style={styles.habitDescription}>{item.description}</Text>
        <View style={styles.row}>
          <View style={styles.streakBox}>
            <MaterialCommunityIcons
              name="fire"
              size={16}
              color={completed ? "#388e3c" : "#FFA726"}
              style={{ marginRight: 4 }}
            />
            <Text style={[
              styles.streakText,
              { color: completed ? "#388e3c" : "#FFA726" }
            ]}>
              {item.streak_count} day{item.streak_count === 1 ? "" : "s"} streak
            </Text>
          </View>
          <View style={styles.frequencyBadge}>
            <Text style={styles.frequencyText}>
              {item.frequency.charAt(0).toUpperCase() + item.frequency.slice(1)}
            </Text>
          </View>
        </View>
        {completed && (
          <Text style={styles.completedBadge}>Completed Today</Text>
        )}
        <View style={styles.buttonsRow}>
          <Button
            mode={completed ? "text" : "outlined"}
            onPress={() => !completed && onCompleteHabit(item)}
            disabled={completed}
            style={styles.completeButton}
            compact
          >
            {completed ? "Done" : "Complete"}
          </Button>
          <Button
            mode="text"
            onPress={() => onDeleteHabit(item)}
            textColor="#FF5252"
            compact
            style={styles.deleteButton}
          >
            Delete
          </Button>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Today's Habits</Text>
        <Pressable onPress={handleLogout} style={styles.signOutTouchable}>
          <MaterialCommunityIcons name="logout" size={18} color="#7c49fb" />
          <Text style={styles.signOut}>Sign Out</Text>
        </Pressable>
      </View>
      <FlatList
        data={habits}
        keyExtractor={(item) => item.$id}
        renderItem={renderHabit}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchHabits} tintColor="#7c49fb" />
        }
        ListEmptyComponent={
          !loading && (
            <Text style={styles.emptyText}>No habits found. Start by adding one!</Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f7fb",
    paddingTop: 40,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 30,
    paddingBottom: 18,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#18181B",
  },
  signOutTouchable: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  signOut: {
    color: "#7c49fb",
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 4,
    marginTop: 2,
  },
  listContent: {
    paddingTop: 16,
    paddingHorizontal: 14,
    paddingBottom: 60,
  },
  card: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
    marginTop: 10,
    marginBottom: 20,
  },
  completedCard: {
    backgroundColor: "#e8f5e9", // pale green for completed
  },
  completedBadge: {
    color: "#388e3c",
    fontWeight: "bold",
    marginTop: 6,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: "#c8e6c9",
    alignSelf: "flex-start",
    fontSize: 13,
  },
  habitTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#18181A",
    marginBottom: 2,
  },
  habitDescription: {
    fontSize: 14,
    color: "#7b7b8b",
    marginBottom: 18,
    marginTop: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  streakBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff9ed",
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginRight: 8,
  },
  streakText: {
    fontSize: 13,
    fontWeight: "600",
  },
  frequencyBadge: {
    backgroundColor: "#f2ebfc",
    paddingHorizontal: 15,
    paddingVertical: 4,
    borderRadius: 12,
  },
  frequencyText: {
    color: "#a48cf5",
    fontWeight: "600",
    fontSize: 13,
    textTransform: "capitalize",
  },
  buttonsRow: {
    flexDirection: "row",
    marginTop: 16,
    justifyContent: "flex-end",
    gap: 12,
  },
  completeButton: {
    borderRadius: 8,
  },
  deleteButton: {
    alignSelf: "center",
  },
  emptyText: {
    color: "#bcbccd",
    fontSize: 16,
    textAlign: "center",
    marginTop: 40,
  },
});
