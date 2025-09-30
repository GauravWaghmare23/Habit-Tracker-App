import { View, StyleSheet, Animated, Easing } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import { Button, SegmentedButtons, Text, TextInput, Avatar } from 'react-native-paper';
import { useAuth } from '@/lib/auth-context';
import { database, DATABASE_ID, HABITS_COLLECTION_ID } from '@/lib/appwrite';
import { ID } from 'react-native-appwrite';
import { useRouter } from 'expo-router';

const Frequencies = ["daily", "weekly", "monthly"];

const AddHabit = () => {
  const [selectedFrequency, setSelectedFrequency] = useState(Frequencies[0]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const { user } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");

  // Animated focus scale for inputs
  const titleScale = useRef(new Animated.Value(1)).current;
  const descriptionScale = useRef(new Animated.Value(1)).current;

  const animateFocus = (scaleRef: Animated.Value) => {
    Animated.timing(scaleRef, {
      toValue: 1.05,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const animateBlur = (scaleRef: Animated.Value) => {
    Animated.timing(scaleRef, {
      toValue: 1,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const handleAddHabit = async () => {
    if (!user) return;
    if (!DATABASE_ID || !HABITS_COLLECTION_ID) {
      setError("Database configuration error.");
      return;
    }
    try {
      await database.createDocument(
        String(DATABASE_ID),
        String(HABITS_COLLECTION_ID),
        ID.unique(),
        {
          title,
          user_id: user.$id,
          description,
          streak_count: 0,
          last_completed: new Date().toISOString(),
          frequency: selectedFrequency,
          created_at: new Date().toISOString(),
        }
      );
      setError("");
      setTitle("");
      setDescription("");
      router.push("/");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
        return;
      }
      setError(String(error));
    }
  };

  return (
    <View style={styles.container}>
      {user && (
        <View style={styles.userInfo}>
          <Avatar.Text size={48} label={user.name ? user.name.charAt(0).toUpperCase() : "U"} />
          <View style={styles.userText}>
            <Text variant="titleMedium" style={styles.userName}>
              Hello, {user.name || "User"}!
            </Text>
            <Text variant="bodySmall" style={styles.userEmail}>
              {user.email || "No Email"}
            </Text>
          </View>
        </View>
      )}

      <Text style={styles.pageTitle}>Add New Habit</Text>

      <Animated.View style={{ transform: [{ scale: titleScale }] }}>
        <TextInput
          label="Title"
          mode="outlined"
          placeholder="Add habit"
          style={styles.input}
          onChangeText={setTitle}
          value={title}
          activeOutlineColor="#7c49fb"
          outlineColor="#d1c4e9"
          textColor="#333"
          onFocus={() => animateFocus(titleScale)}
          onBlur={() => animateBlur(titleScale)}
          returnKeyType="next"
        />
      </Animated.View>

      <Animated.View style={{ transform: [{ scale: descriptionScale }] }}>
        <TextInput
          label="Description"
          mode="outlined"
          placeholder="Add habit description"
          style={[styles.input, styles.textArea]}
          multiline
          numberOfLines={3}
          onChangeText={setDescription}
          value={description}
          activeOutlineColor="#7c49fb"
          outlineColor="#d1c4e9"
          textColor="#555"
          onFocus={() => animateFocus(descriptionScale)}
          onBlur={() => animateBlur(descriptionScale)}
        />
      </Animated.View>

      <View style={styles.segmentedContainer}>
        <SegmentedButtons
          buttons={Frequencies.map(freq => ({
            value: freq,
            label: freq.charAt(0).toUpperCase() + freq.slice(1),
          }))}
          value={selectedFrequency}
          onValueChange={setSelectedFrequency}
          style={styles.segmentedButtons}
          density="medium"
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Button
        onPress={handleAddHabit}
        disabled={!title.trim() || !description.trim()}
        mode="contained"
        style={styles.button}
        labelStyle={{ fontWeight: 'bold', fontSize: 16 }}
        buttonColor="#7c49fb"
        textColor="#fff"
      >
        Add Habit
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fdfaff",
    justifyContent: "center",
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  userText: {
    marginLeft: 14,
  },
  userName: {
    fontWeight: '700',
    color: '#7c49fb',
  },
  userEmail: {
    color: '#aaa',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#7c49fb",
    marginBottom: 24,
    textAlign: "center",
    letterSpacing: 1,
  },
  input: {
    marginBottom: 22,
    backgroundColor: "#fff",
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 7,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  segmentedContainer: {
    marginBottom: 32,
  },
  segmentedButtons: {
    backgroundColor: "#efe9f9",
    borderRadius: 16,
    elevation: 4,
  },
  button: {
    borderRadius: 16,
    paddingVertical: 14,
    elevation: 6,
  },
  errorText: {
    color: "red",
    marginBottom: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default AddHabit;
