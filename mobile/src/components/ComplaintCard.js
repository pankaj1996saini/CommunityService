import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBadge, PriorityBadge } from './Badge';
import { CATEGORY_ICONS } from '../constants';
import { colors, radius, shadow } from '../theme';
import { timeAgo } from '../utils/format';

// One row in the complaint list. React.memo because FlatList re-renders a lot.
function ComplaintCard({ item, onPress, showReporter }) {
  return (
    <Pressable onPress={() => onPress(item)} style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}>
      <View style={styles.iconBox}>
        <Ionicons name={CATEGORY_ICONS[item.category] || CATEGORY_ICONS.Other} size={22} color={colors.primary} />
      </View>

      <View style={{ flex: 1 }}>
        <View style={styles.topRow}>
          <Text style={styles.ticket}>{item.ticketId}</Text>
          <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.locRow}>
          <Ionicons name="location-outline" size={13} color={colors.muted} />
          <Text style={styles.loc} numberOfLines={1}>
            {item.location}
            {showReporter && item.createdBy ? `  ·  ${item.createdBy.name}` : ''}
          </Text>
        </View>
        <View style={styles.badges}>
          <StatusBadge status={item.status} />
          <View style={{ width: 6 }} />
          <PriorityBadge priority={item.priority} />
          {item.assignedTo ? (
            <Text style={styles.assignee} numberOfLines={1}>
              {item.assignedTo.name}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export default React.memo(ComplaintCard);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 10,
    ...shadow,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between' },
  ticket: { fontSize: 11, color: colors.muted, fontWeight: '600', letterSpacing: 0.3 },
  time: { fontSize: 11, color: colors.muted },
  title: { fontSize: 15, fontWeight: '600', color: colors.text, marginTop: 2 },
  locRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  loc: { fontSize: 12, color: colors.muted, marginLeft: 3, flex: 1 },
  badges: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  assignee: { fontSize: 11, color: colors.muted, marginLeft: 'auto', maxWidth: 110 },
});
