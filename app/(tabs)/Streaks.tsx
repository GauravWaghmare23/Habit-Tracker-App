import { View, StyleSheet, FlatList } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { database, client, DATABASE_ID, HABITS_COLLECTION_ID } from '@/lib/appwrite';
import { Query } from "react-native-appwrite";
import { useAuth } from '@/lib/auth-context';

type HabitSummary = {
  $id: string,
  title: string,
  description: string,
  streak_count: number,
  best_streak: number,
  total_completed: number,
  last_completed?: string // added for UI display
};

const Streaks = () => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<HabitSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHabits();
    if (user) {
      // Realtime subscription for habit updates
      const unsubscribe = client.subscribe(
        [`databases.${DATABASE_ID}.collections.${HABITS_COLLECTION_ID}.documents`],
        (resp: any) => {
          const payload: HabitSummary = resp.payload;
          if (payload.user_id === user.$id) fetchHabits();
        }
      );
      return () => unsubscribe();
    }
  }, [user]);

  const fetchHabits = async () => {
    if (!user) {
      setHabits([]);
      return;
    }
    setLoading(true);
    try {
      const response = await database.listDocuments(
        DATABASE_ID as string,
        HABITS_COLLECTION_ID as string,
        [Query.equal("user_id", user.$id)]
      );
      setHabits((response.documents as any[]).map(doc => ({
        $id: doc.$id,
        title: doc.title,
        description: doc.description,
        streak_count: doc.streak_count,
        best_streak: doc.best_streak ?? doc.streak_count,
        total_completed: doc.total_completed ?? 1,
        last_completed: doc.last_completed
      })));
    } finally {
      setLoading(false);
    }
  };

  // Sort by best streak for top habits
  const sortedHabits = [...habits].sort((a, b) => b.best_streak - a.best_streak);
  const habitsWithStreak = sortedHabits.filter(h => h.streak_count > 0);
  const brokenHabits = sortedHabits.filter(h => h.streak_count === 0 && h.best_streak > 0);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Habit Streaks</Text>
      <View style={styles.topSection}>
        <View style={styles.topCard}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <MaterialCommunityIcons name="medal" size={20} color="#a48cf5" />
            <Text style={styles.topTitle}> Top Streaks</Text>
          </View>
          {sortedHabits.slice(0, 3).map((h, i) => (
            <View style={styles.topRow} key={h.$id}>
              <View style={[styles.circle, { backgroundColor: rankColors[i] }]}>
                <Text style={styles.circleText}>{i + 1}</Text>
              </View>
              <Text style={styles.topHabitLabel}>{h.title}</Text>
              <Text style={styles.topStreakText}>
                Best: <Text style={{ color: "#7c49fb", fontWeight: "bold" }}>{h.best_streak}</Text>
              </Text>
            </View>
          ))}
        </View>
      </View>

      <FlatList
        data={habitsWithStreak}
        keyExtractor={item => item.$id}
        ListHeaderComponent={<View style={{ height: 8 }} />}
        renderItem={({ item }) => <HabitCard habit={item} highlight />}
        ListFooterComponent={
          <>
            {brokenHabits.length > 0 && (
              <>
                <Text style={styles.brokenHeader}>Streak Broken</Text>
                {brokenHabits.map(h =>
                  <HabitCard habit={h} key={h.$id} highlight={false} />
                )}
              </>
            )}
          </>
        }
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </View>
  );
};

const rankColors = ["#ffe066", "#c0c0c0", "#b08d57"];

const formatDate = (iso?: string) => {
  if (!iso) return "Never";
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric"
  });
};

const HabitCard = ({ habit, highlight }: { habit: HabitSummary, highlight: boolean }) => (
  <View style={[styles.habitCard, highlight ? styles.habitCardHighlight : styles.habitCardBroken]}>
    <Text style={styles.cardTitle}>{habit.title}</Text>
    <Text style={styles.cardDesc}>{habit.description}</Text>
    <View style={styles.badgeRow}>
      <View style={styles.badgeCurrent}>
        <MaterialCommunityIcons name="fire" size={16} color="#ff9449" />
        <Text style={styles.badgeValue}>{habit.streak_count}</Text>
        <Text style={styles.badgeLabel}>Current</Text>
      </View>
      <View style={styles.badgeBest}>
        <MaterialCommunityIcons name="trophy" size={16} color="#f3c33c" />
        <Text style={styles.badgeValue}>{habit.best_streak}</Text>
        <Text style={styles.badgeLabel}>Best</Text>
      </View>
      <View style={styles.badgeTotal}>
        <MaterialCommunityIcons name="check-circle" size={16} color="#4bb543" />
        <Text style={styles.badgeValue}>{habit.total_completed}</Text>
        <Text style={styles.badgeLabel}>Total</Text>
      </View>
    </View>
    <View style={styles.lastCompletedBadge}>
      <MaterialCommunityIcons name="clock-outline" size={14} color="#7c49fb" />
      <Text style={styles.lastCompletedText}>Last Completed: {formatDate(habit.last_completed)}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f7fb",
    paddingHorizontal: 0,
    paddingTop: 24,
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#18181b",
    marginLeft: 16,
    marginBottom: 16,
    marginTop: 6,
  },
  topSection: { paddingHorizontal: 8 },
  topCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 18,
    shadowColor: "#7c49fb",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 15,
    elevation: 4,
  },
  topTitle: {
    fontWeight: "bold",
    color: "#a48cf5",
    fontSize: 17,
    marginLeft: 7,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 0,
  },
  circle: {
    height: 26,
    width: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  circleText: { fontWeight: "bold", color: "#333", fontSize: 15 },
  topHabitLabel: { fontWeight: "600", flex: 1, color: "#333" },
  topStreakText: { fontWeight: "600", fontSize: 13 },
  habitCard: {
    marginHorizontal: 16,
    marginBottom: 18,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#fff",
    shadowColor: "#7c49fb",
    shadowOpacity: 0.09,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 2,
  },
  habitCardHighlight: { borderColor: "#a48cf5" },
  habitCardBroken: { borderColor: "#f7f7f7" },
  cardTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#232323",
    marginBottom: 2,
  },
  cardDesc: {
    color: "#757575",
    fontSize: 13,
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  badgeCurrent: {
    backgroundColor: "#fff4ef",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 4,
    minWidth: 60,
    justifyContent: "center",
  },
  badgeBest: {
    backgroundColor: "#fff9e6",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 4,
    minWidth: 60,
    justifyContent: "center",
  },
  badgeTotal: {
    backgroundColor: "#ebf9ed",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 4,
    minWidth: 60,
    justifyContent: "center",
  },
  badgeValue: {
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 4,
    color: "#222",
  },
  badgeLabel: {
    marginLeft: 3,
    fontSize: 12,
    color: "#888",
    fontWeight: "600",
  },
  lastCompletedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f0ff",
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 7,
    maxWidth: 185,
    alignSelf: "flex-start"
  },
  lastCompletedText: {
    fontSize: 12,
    color: "#7c49fb",
    marginLeft: 4,
    fontWeight: "500",
  },
  brokenHeader: {
    marginLeft: 26,
    fontWeight: "bold",
    fontSize: 15,
    color: "#ea5353",
    marginBottom: 8,
    marginTop: 20,
  },
});

export default Streaks;
