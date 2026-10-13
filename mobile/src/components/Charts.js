import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import { shortDay } from '../utils/format';

// Tiny hand-rolled charts, no chart library needed for two simple views.

export function DayBars({ data }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <View style={styles.dayRow}>
      {data.map((d) => (
        <View key={d.date} style={styles.dayCol}>
          <Text style={styles.dayValue}>{d.count}</Text>
          <View style={styles.dayTrack}>
            <View style={[styles.dayBar, { height: `${(d.count / max) * 100}%` }]} />
          </View>
          <Text style={styles.dayLabel}>{shortDay(d.date)}</Text>
        </View>
      ))}
    </View>
  );
}

export function HBar({ label, value, max, color = colors.primary, suffix = '' }) {
  const pct = max ? Math.max((value / max) * 100, value ? 4 : 0) : 0;
  return (
    <View style={styles.hRow}>
      <Text style={styles.hLabel} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.hTrack}>
        <View style={[styles.hFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.hValue}>
        {value}
        {suffix}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dayRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  dayCol: { flex: 1, alignItems: 'center' },
  dayValue: { fontSize: 11, color: colors.muted, marginBottom: 3 },
  dayTrack: { height: 80, width: 22, justifyContent: 'flex-end', backgroundColor: colors.bg, borderRadius: 6 },
  dayBar: { width: '100%', minHeight: 3, backgroundColor: colors.primary, borderRadius: 6 },
  dayLabel: { fontSize: 11, color: colors.muted, marginTop: 4 },

  hRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  hLabel: { width: 96, fontSize: 12, color: colors.text },
  hTrack: { flex: 1, height: 10, backgroundColor: colors.bg, borderRadius: 5, overflow: 'hidden' },
  hFill: { height: '100%', borderRadius: 5 },
  hValue: { width: 40, textAlign: 'right', fontSize: 12, color: colors.muted },
});
