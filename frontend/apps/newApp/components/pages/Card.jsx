import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

export default function Card({ name, description }) {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{name}</Text>
      {description ? <Text style={styles.desc}>{description}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  name: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  desc: { color: '#444' },
})