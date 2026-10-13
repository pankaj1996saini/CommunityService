import React, { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useNotifications } from '../context/NotificationContext';
import { EmptyState, ErrorBanner, ErrorState, Loader } from '../components/States';
import { colors, radius, shadow } from '../theme';
import { timeAgo } from '../utils/format';

export default function NotificationsScreen({ navigation }) {
  const { items, unread, loading, error, refresh, markRead, markAllRead } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    refresh().finally(() => setRefreshing(false));
  };

  const open = (n) => {
    if (!n.read) markRead(n._id);
    if (n.complaint) navigation.navigate('ComplaintDetail', { id: n.complaint });
  };

  if (loading && items.length === 0) return <Loader />;
  if (error && items.length === 0) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      data={items}
      keyExtractor={(n) => n._id}
      contentContainerStyle={{ padding: 12, flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      ListHeaderComponent={
        <View>
          {error ? <ErrorBanner message={error} onRetry={refresh} /> : null}
          {unread > 0 ? (
            <Text style={styles.markAll} onPress={markAllRead}>
              Mark all as read ({unread})
            </Text>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          icon="notifications-off-outline"
          title="You're all caught up"
          message="Updates about your complaints will show up here."
        />
      }
      renderItem={({ item }) => (
        <Pressable onPress={() => open(item)} style={[styles.row, !item.read && styles.unreadRow]}>
          <View style={[styles.dot, item.read && { backgroundColor: 'transparent' }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, !item.read && { fontWeight: '700' }]}>{item.title}</Text>
            {item.message ? <Text style={styles.message}>{item.message}</Text> : null}
            <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  markAll: { color: colors.primary, fontWeight: '600', fontSize: 13, textAlign: 'right', marginBottom: 10 },
  row: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 8,
    ...shadow,
  },
  unreadRow: { backgroundColor: '#f3f6ff' },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary, marginTop: 6, marginRight: 10 },
  title: { fontSize: 14, color: colors.text, fontWeight: '600' },
  message: { fontSize: 13, color: colors.muted, marginTop: 2 },
  time: { fontSize: 11, color: colors.muted, marginTop: 6 },
});
