import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export default function MedAi() {

  const [text, setText] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "1",
      sender: "assistant",
      text: "Hello 👋 I'm MedAI. Ask me about medicines or symptoms."
    }
  ]);
  

  const [pendingPromptId, setPendingPromptId] = useState(null);
  const [typing, setTyping] = useState(false);
  const listRef = useRef(null);

  // Poll server
  useEffect(() => {
    let mounted = true;

    const poll = async () => {
      const base = "http://10.249.2.231:2000";

      while (mounted) {
        try {
          const res = await fetch(`${base}/api/prompt`);

          if (res.status === 200) {
            const data = await res.json();

            const promptMsg = {
              id: data.id + "-prompt",
              sender: "assistant",
              text: data.prompt
            };

            setMessages((prev) => [promptMsg, ...prev]);
            setPendingPromptId(data.id);
          }
        } catch {}

        await new Promise((r) => setTimeout(r, 2000));
      }
    };

    poll();
    return () => (mounted = false);
  }, []);

  const sendMessage = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: "user",
      text: trimmed
    };

    setMessages((prev) => [userMsg, ...prev]);
    setText("");

    if (pendingPromptId) {
      const base = "http://10.96.226.231:2000";

      fetch(`${base}/api/response`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: pendingPromptId,
          response: trimmed
        })
      });

      setPendingPromptId(null);
      return;
    }

    // Mock AI reply
    setTyping(true);

    setTimeout(() => {
      const reply = {
        id: Date.now().toString(),
        sender: "assistant",
        text: `🔎 Searching medicine database for "${trimmed}"...`
      };

      setMessages((prev) => [reply, ...prev]);
      setTyping(false);
    }, 1000);
  };

  const renderItem = ({ item }) => {
    const isUser = item.sender === "user";

    return (
      <View
        style={[
          styles.messageRow,
          isUser ? styles.rowUser : styles.rowAssistant
        ]}
      >
        {!isUser && (
          <View style={styles.avatar}>
            <Ionicons name="medkit" size={18} color="#fff" />
          </View>
        )}

        <View
          style={[
            styles.bubble,
            isUser ? styles.userBubble : styles.aiBubble
          ]}
        >
          <Text style={[styles.text, isUser && styles.userText]}>
            {item.text}
          </Text>
        </View>

        {isUser && (
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={18} color="#fff" />
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >

        {/* Header */}
        <LinearGradient
          colors={["#2563eb", "#1e3a8a"]}
          style={styles.header}
        >
          <View style={styles.headerRow}>
            <View style={styles.logo}>
              <Ionicons name="medkit" size={22} color="#fff" />
            </View>

            <View>
              <Text style={styles.headerTitle}>MedAI Doctor</Text>
              <Text style={styles.headerSubtitle}>
                AI Health Assistant
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          inverted
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.chatArea}
        />

        {/* Typing indicator */}
        {typing && (
          <View style={styles.typing}>
            <Text style={styles.typingText}>MedAI is typing...</Text>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputArea}>
          <View style={styles.inputBox}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Ask about medicines..."
              placeholderTextColor="#888"
              style={styles.input}
              returnKeyType="send"
              onSubmitEditing={sendMessage}
            />

            <TouchableOpacity
              style={styles.sendButton}
              onPress={sendMessage}
            >
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  safe: {
    flex: 1,
    backgroundColor: "#f1f5f9"
  },

  header: {
    padding: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center"
  },

  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff"
  },

  headerSubtitle: {
    fontSize: 12,
    color: "#bfdbfe"
  },

  chatArea: {
    padding: 14
  },

  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 12
  },

  rowAssistant: {
    justifyContent: "flex-start"
  },

  rowUser: {
    justifyContent: "flex-end"
  },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6
  },

  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#64748b",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6
  },

  bubble: {
    maxWidth: "70%",
    padding: 12,
    borderRadius: 16
  },

  aiBubble: {
    backgroundColor: "#e0e7ff"
  },

  userBubble: {
    backgroundColor: "#2563eb"
  },

  text: {
    fontSize: 14,
    color: "#1f2937"
  },

  userText: {
    color: "#fff"
  },

  typing: {
    paddingLeft: 20,
    marginBottom: 4
  },

  typingText: {
    fontSize: 12,
    color: "#6b7280"
  },

  inputArea: {
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb"
  },

  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 25,
    paddingHorizontal: 14
  },

  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 10
  },

  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center"
  }
});