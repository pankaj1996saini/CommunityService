import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { priorityColors, radius, statusColors } from '../theme';

function Badge({ label, fg, bg }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function StatusBadge({ status }) {
  const c = statusColors[status] || statusColors.Open;
  return <Badge label={status} fg={c.fg} bg={c.bg} />;
}

export function PriorityBadge({ priority }) {
  const c = priorityColors[priority] || priorityColors.Medium;
  return <Badge label={priority} fg={c.fg} bg={c.bg} />;
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.pill, alignSelf: 'flex-start' },
  text: { fontSize: 11, fontWeight: '700' },
});
