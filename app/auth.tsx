import { View, KeyboardAvoidingView, Platform, StyleSheet } from "react-native"
import { Text, TextInput, Button } from "react-native-paper"
import React, { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "expo-router"

const Auth = () => {
  const [isSignedUp, setIsSignedUp] = useState<boolean>(false)
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [error, setError] = useState<string>("")
  const { signIn, signUp } = useAuth()
  const router = useRouter()
  const toggleSignUp = () => setIsSignedUp(prev => !prev)

  const handleAuth = async () => {
    if (!email || !password) {
      setError("Please enter email and password")
      return
    }
    if (password.length < 6) {
      setError("Password should be greater than 6 characters")
      return
    }
    if (isSignedUp) {
      try {
        await signUp(email, password)
        setError("")
      } catch (err: any) {
        setError(err.message || "Sign up failed")
        return
      }
    } else {
      try {
        await signIn(email, password)
        setError("")
        router.push("/")
      } catch (error: any) {
        setError(error.message || "Login failed")
        return
      }
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        <Text style={styles.appName}>HabMe</Text>
        <Text style={styles.mainText}>{isSignedUp ? "Create Account" : "Welcome Back"}</Text>

        <TextInput
          style={styles.input}
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email"
          mode="outlined"
          onChangeText={setEmail}
          value={email}
          activeOutlineColor="#7c49fb"
          outlineColor="#d1c4e9"
          textColor="#333"
        />
        <TextInput
          style={[styles.input, styles.passwordInput]}
          label="Password"
          placeholder="Password"
          mode="outlined"
          secureTextEntry
          onChangeText={setPassword}
          value={password}
          activeOutlineColor="#7c49fb"
          outlineColor="#d1c4e9"
          textColor="#333"
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          onPress={handleAuth}
          style={styles.button}
          mode="contained"
          buttonColor="#7c49fb"
          labelStyle={{ fontWeight: "bold", fontSize: 16 }}
        >
          {isSignedUp ? "Sign Up" : "Login"}
        </Button>

        <Button onPress={toggleSignUp} mode="text" textColor="#7c49fb" contentStyle={{ paddingTop: 8 }}>
          {isSignedUp ? "Already have an account? Login" : "Don't have an account? Sign Up"}
        </Button>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#fafaff",
  },
  container: {
    padding: 24,
    flex: 1,
    justifyContent: "center",
  },
  appName: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#7c49fb",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: 1.2,
  },
  mainText: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 32,
    color: "#18181B",
  },
  input: {
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  passwordInput: {
    marginBottom: 24,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 12,
    elevation: 4,
    marginBottom: 8,
  },
  errorText: {
    color: "red",
    marginBottom: 12,
    fontWeight: "600",
    textAlign: "center",
  },
})

export default Auth
