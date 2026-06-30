import React, { useMemo, useState, useRef } from "react";
import {
  Text,
  View,
  TextInput,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Animated,
  TouchableOpacity
} from "react-native";
import Card from "./Card";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const medicines = require("../../assets/medicines.json");

export default function Search() {

  const [query, setQuery] = useState("");
  const focusAnim = useRef(new Animated.Value(0)).current;

  const results = useMemo(() => {
    if (!query || query.trim().length === 0) return [];
    const q = query.toLowerCase();
    return medicines.filter(
      (m) =>
        (m.name && m.name.toLowerCase().includes(q)) ||
        (m.description && m.description.toLowerCase().includes(q))
    );
  }, [query]);

  const onFocus = () => {
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  const onBlur = () => {
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#ddd", "#4A90E2"],
  });

  return (
    <LinearGradient colors={["#f6f9ff", "#e9f1ff"]} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Medicine Finder</Text>
          <Text style={styles.subtitle}>
            Search medicines instantly
          </Text>
        </View>

        {/* Animated Search Bar */}
        <Animated.View style={[styles.searchBox, { borderColor }]}>
          <Ionicons name="search" size={20} color="#666" />

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search medicine or symptoms..."
            style={styles.input}
            onFocus={onFocus}
            onBlur={onBlur}
            clearButtonMode="while-editing"
          />

          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={20} color="#888" />
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Result Counter */}
        {query.length > 0 && (
          <Text style={styles.resultCount}>
            {results.length} medicine{results.length !== 1 ? "s" : ""} found
          </Text>
        )}

        {/* Hint */}
        {query.trim().length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="medkit-outline" size={60} color="#b0c4ff" />
            <Text style={styles.hintTitle}>Search for medicines</Text>
            <Text style={styles.hintText}>
              Type a medicine name or symptom to find results
            </Text>
          </View>
        )}

        {/* Results */}
        <FlatList
          data={results}
          keyExtractor={(item) => item.id?.toString() || item.name}
          renderItem={({ item }) => (
            <Card name={item.name} description={item.description} />
          )}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={
            query.length > 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="alert-circle-outline" size={50} color="#ccc" />
                <Text style={styles.no}>No medicines found</Text>
              </View>
            )
          }
        />

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    padding: 20,
  },

  header: {
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#222",
  },

  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 2,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },

  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },

  resultCount: {
    fontSize: 13,
    color: "#666",
    marginBottom: 10,
    marginLeft: 2,
  },

  hintTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#444",
    marginTop: 10,
  },

  hintText: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    marginTop: 5,
    paddingHorizontal: 40,
  },

  hint: {
    color: "#666",
    marginBottom: 8,
  },

  no: {
    color: "#888",
    marginTop: 10,
    fontSize: 15,
  },

  emptyState: {
    alignItems: "center",
    marginTop: 40,
  },
});