import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow } from '../theme';

export default function StatCard({ label, value, color = colors.primary, onPress, style }) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper onPress={onPress} style={[styles.card, style]}>
      <View style={[styles.bar, { backgroundColor: color }]} />
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 14,
    overflow: 'hidden',
    ...shadow,
  },
  bar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  value: { fontSize: 26, fontWeight: '700' },
  label: { fontSize: 12, color: colors.muted, marginTop: 2 },
});
