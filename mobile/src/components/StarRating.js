import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Pass onChange to make it tappable, leave it out for a read-only display.
export default function StarRating({ value = 0, onChange, size = 28 }) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((n) => {
        const star = (
          <Ionicons name={n <= Math.round(value) ? 'star' : 'star-outline'} size={size} color="#f2a900" />
        );
        return onChange ? (
          <Pressable key={n} onPress={() => onChange(n)} hitSlop={4} style={{ marginRight: 4 }}>
            {star}
          </Pressable>
        ) : (
          <View key={n} style={{ marginRight: 2 }}>
            {star}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});
