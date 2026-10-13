import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { complaintApi, statsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import ComplaintCard from '../components/ComplaintCard';
import AppButton from '../components/AppButton';
import StarRating from '../components/StarRating';
import { DayBars, HBar } from '../components/Charts';
import { EmptyState, ErrorBanner, ErrorState, Loader } from '../components/States';
import { STATUSES } from '../constants';
import { colors, radius, shadow, statusColors } from '../theme';
import { formatHours } from '../utils/format';

const GREETING_SUB = {
  user: 'Report a problem and follow it until it is fixed.',
  staff: 'Here is what is on your plate.',
  admin: 'A quick look at how the community is doing.',
};

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const [s, list] = await Promise.all([statsApi.get(), complaintApi.list({ limit: 5 })]);
      setStats(s);
      setRecent(list.items);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // refresh whenever the tab comes back into view (e.g. after filing a complaint)
  useFocusEffect(
    useCallback(() => {
      load().finally(() => setLoading(false));
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load().finally(() => setRefreshing(false));
  };

  const openList = (params = {}) => navigation.navigate('Complaints', { ts: Date.now(), ...params });
  const openComplaint = (c) => navigation.navigate('ComplaintDetail', { id: c._id });

  if (loading) return <Loader label="Loading your dashboard..." />;
  if (error && !stats) return <ErrorState message={error} onRetry={() => { setLoading(true); load().finally(() => setLoading(false)); }} />;

  const isAdmin = user.role === 'admin';
  const isStaff = user.role === 'staff';

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      {error ? <ErrorBanner message={error} onRetry={load} /> : null}

      <View style={styles.hero}>
        <Text style={styles.heroHello}>Hello, {user.name.split(' ')[0]}</Text>
        <Text style={styles.heroSub}>{GREETING_SUB[user.role]}</Text>
        {user.role === 'user' ? (
          <AppButton
            title="Report a problem"
            icon="add-circle-outline"
            variant="outline"
            onPress={() => navigation.navigate('CreateComplaint')}
            style={{ marginTop: 14, borderColor: '#fff' }}
          />
        ) : null}
      </View>

      <Text style={styles.sectionTitle}>{isStaff ? 'My tasks' : isAdmin ? 'All complaints' : 'My complaints'}</Text>
      <View style={styles.grid}>
        {STATUSES.map((s) => (
          <StatCard
            key={s}
            label={s}
            value={stats.byStatus[s]}
            color={statusColors[s].fg}
            style={styles.gridItem}
            onPress={() => openList({ status: s })}
          />
        ))}
      </View>

      {isAdmin ? <AdminInsights stats={stats} openList={openList} /> : null}

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{isStaff ? 'Latest assigned to you' : 'Recent complaints'}</Text>
        {recent.length > 0 ? (
          <Text style={styles.link} onPress={() => openList({ status: 'All' })}>
            See all
          </Text>
        ) : null}
      </View>

      {recent.length === 0 ? (
        <View style={[styles.card, { padding: 0 }]}>
          <EmptyState
            icon="clipboard-outline"
            title={isStaff ? 'No tasks yet' : 'No complaints yet'}
            message={
              user.role === 'user'
                ? 'When something needs fixing, report it and it will show up here.'
                : isStaff
                ? 'Tasks assigned to you by the admin will appear here.'
                : 'Nothing has been reported yet.'
            }
            actionLabel={user.role === 'user' ? 'Report a problem' : undefined}
            onAction={() => navigation.navigate('CreateComplaint')}
          />
        </View>
      ) : (
        recent.map((c) => <ComplaintCard key={c._id} item={c} onPress={openComplaint} showReporter={user.role !== 'user'} />)
      )}
    </ScrollView>
  );
}

function AdminInsights({ stats, openList }) {
  const maxCategory = Math.max(1, ...(stats.byCategory || []).map((c) => c.count));
  const maxStaff = Math.max(1, ...(stats.staffPerformance || []).map((s) => s.assigned));

  return (
    <>
      <View style={[styles.grid, { marginTop: 10 }]}>
        <StatCard label="Pending" value={stats.pending} color={colors.warning} style={styles.gridItem} />
        <StatCard
          label="Not assigned"
          value={stats.unassigned}
          color={colors.danger}
          style={styles.gridItem}
          onPress={() => openList({ status: 'Open', unassigned: true })}
        />
        <StatCard label="Resolved %" value={`${stats.resolutionRate}%`} color={colors.success} style={styles.gridItem} />
        <StatCard label="Avg. fix time" value={formatHours(stats.avgResolutionHours)} color={colors.primary} style={styles.gridItem} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Resident satisfaction</Text>
        {stats.avgRating ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <StarRating value={stats.avgRating} size={22} />
            <Text style={styles.ratingText}>
              {stats.avgRating} / 5 from {stats.ratingCount} {stats.ratingCount === 1 ? 'review' : 'reviews'}
            </Text>
          </View>
        ) : (
          <Text style={styles.muted}>No feedback yet.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>New complaints, last 7 days</Text>
        <DayBars data={stats.last7Days} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>By category</Text>
        {stats.byCategory.length === 0 ? (
          <Text style={styles.muted}>Nothing to show yet.</Text>
        ) : (
          stats.byCategory.map((c) => <HBar key={c.category} label={c.category} value={c.count} max={maxCategory} />)
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Staff workload</Text>
        {stats.staffPerformance.length === 0 ? (
          <Text style={styles.muted}>No complaints have been assigned yet.</Text>
        ) : (
          stats.staffPerformance.map((s) => (
            <View key={s.id} style={styles.staffRow}>
              <Ionicons name="person-circle-outline" size={28} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.staffName}>{s.name}</Text>
                <HBar label={s.department || 'General'} value={s.resolved} max={maxStaff} color={colors.success} suffix={`/${s.assigned}`} />
              </View>
            </View>
          ))
        )}
        <Text style={styles.muted}>Bars show resolved out of assigned.</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  hero: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: 18, marginBottom: 18 },
  heroHello: { color: '#fff', fontSize: 22, fontWeight: '800' },
  heroSub: { color: '#dbe4ff', fontSize: 14, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 10 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 },
  link: { color: colors.primary, fontWeight: '600', fontSize: 13, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
  gridItem: { flexBasis: '45%', flexGrow: 1, margin: 5 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, marginTop: 12, ...shadow },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 12 },
  muted: { fontSize: 12, color: colors.muted },
  ratingText: { marginLeft: 10, fontSize: 13, color: colors.muted },
  staffRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  staffName: { fontSize: 14, fontWeight: '600', color: colors.text },
});
