import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, statusColors } from '../theme';
import { formatDateTime } from '../utils/format';

const ROLE_LABEL = { admin: 'Admin', staff: 'Staff', user: 'Reporter' };

// Vertical history of everything that happened to a complaint, oldest first.
export default function Timeline({ entries = [] }) {
  return (
    <View>
      {entries.map((e, i) => {
        const last = i === entries.length - 1;
        const dot = (statusColors[e.status] || statusColors.Open).fg;
        return (
          <View key={e._id || i} style={styles.row}>
            <View style={styles.rail}>
              <View style={[styles.dot, { backgroundColor: dot }]} />
              {!last ? <View style={styles.line} /> : null}
            </View>
            <View style={[styles.body, last && { paddingBottom: 0 }]}>
              <Text style={[styles.status, { color: dot }]}>{e.status}</Text>
              {e.note ? <Text style={styles.note}>{e.note}</Text> : null}
              <Text style={styles.meta}>
                {e.byName ? `${e.byName} (${ROLE_LABEL[e.byRole] || e.byRole}) · ` : ''}
                {formatDateTime(e.at)}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  rail: { width: 22, alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  line: { flex: 1, width: 2, backgroundColor: colors.border, marginTop: 2 },
  body: { flex: 1, paddingBottom: 18, paddingLeft: 6 },
  status: { fontSize: 13, fontWeight: '700' },
  note: { fontSize: 14, color: colors.text, marginTop: 2 },
  meta: { fontSize: 11, color: colors.muted, marginTop: 3 },
});
