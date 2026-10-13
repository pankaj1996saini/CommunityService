import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { complaintApi } from '../api';
import { useAuth } from '../context/AuthContext';
import ComplaintCard from '../components/ComplaintCard';
import Chip from '../components/Chip';
import { EmptyState, ErrorBanner, ErrorState, Loader } from '../components/States';
import { CATEGORIES, STATUSES } from '../constants';
import { colors, radius } from '../theme';

const PAGE_SIZE = 15;

export default function ComplaintListScreen({ navigation, route }) {
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [q, setQ] = useState(''); // debounced copy of search
  const [status, setStatus] = useState('All');
  const [category, setCategory] = useState('All');
  const [unassigned, setUnassigned] = useState(false);

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const requestId = useRef(0); // so a slow old response can't overwrite a newer one

  // wait for the person to stop typing before hitting the API
  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  // the dashboard sends us here with a filter, `ts` changes on every tap so we notice repeats
  const incoming = route.params;
  useEffect(() => {
    if (incoming && incoming.ts) {
      setStatus(incoming.status || 'All');
      setUnassigned(!!incoming.unassigned);
      setCategory('All');
      setSearch('');
    }
  }, [incoming && incoming.ts]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPage = useCallback(
    async (p) => {
      const id = ++requestId.current;
      try {
        const data = await complaintApi.list({
          page: p,
          limit: PAGE_SIZE,
          q,
          status: status === 'All' ? undefined : status,
          category: category === 'All' ? undefined : category,
          unassigned: unassigned ? 'true' : undefined,
        });
        if (id !== requestId.current) return;
        setItems((prev) => (p === 1 ? data.items : [...prev, ...data.items]));
        setPage(data.page);
        setPages(data.pages);
        setTotal(data.total);
        setError(null);
      } catch (err) {
        if (id === requestId.current) setError(err.message);
      }
    },
    [q, status, category, unassigned]
  );

  // filters changed -> start over from page 1
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPage(1).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchPage]);

  // coming back to this tab (say after closing a complaint) -> quietly refresh
  const latestFetch = useRef(fetchPage);
  latestFetch.current = fetchPage;
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      latestFetch.current(1);
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchPage(1).finally(() => setRefreshing(false));
  };

  const onEndReached = () => {
    if (loading || loadingMore || refreshing || page >= pages) return;
    setLoadingMore(true);
    fetchPage(page + 1).finally(() => setLoadingMore(false));
  };

  const openComplaint = useCallback((c) => navigation.navigate('ComplaintDetail', { id: c._id }), [navigation]);

  const filtersActive = !!q || status !== 'All' || category !== 'All' || unassigned;
  const clearFilters = () => {
    setSearch('');
    setStatus('All');
    setCategory('All');
    setUnassigned(false);
  };

  const emptyTitle = filtersActive ? 'Nothing matches' : user.role === 'staff' ? 'No tasks yet' : 'No complaints yet';
  const emptyMessage = filtersActive
    ? 'Try a different search or clear the filters.'
    : user.role === 'user'
    ? 'Tap the + button to report your first problem.'
    : user.role === 'staff'
    ? 'Tasks the admin assigns to you will show up here.'
    : 'Complaints will appear here as soon as residents report them.';

  return (
    <View style={styles.root}>
      <View style={styles.filters}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by title, ticket ID or location"
            placeholderTextColor="#9aa3b5"
            style={styles.searchInput}
            returnKeyType="search"
          />
          {search ? (
            <Pressable onPress={() => setSearch('')} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {['All', ...STATUSES].map((s) => (
            <Chip key={s} label={s} small selected={status === s} onPress={() => setStatus(s)} />
          ))}
          {user.role === 'admin' ? (
            <Chip label="Unassigned" small icon="alert-circle-outline" selected={unassigned} onPress={() => setUnassigned((u) => !u)} />
          ) : null}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {['All', ...CATEGORIES].map((c) => (
            <Chip key={c} label={c === 'All' ? 'All categories' : c} small selected={category === c} onPress={() => setCategory(c)} />
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <Loader label="Loading complaints..." />
      ) : error && items.length === 0 ? (
        <ErrorState message={error} onRetry={() => fetchPage(1)} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <ComplaintCard item={item} onPress={openComplaint} showReporter={user.role !== 'user'} />}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View>
              {error ? <ErrorBanner message={error} onRetry={() => fetchPage(1)} /> : null}
              {items.length > 0 ? (
                <View style={styles.countRow}>
                  <Text style={styles.count}>
                    {total} {total === 1 ? 'complaint' : 'complaints'}
                  </Text>
                  {filtersActive ? (
                    <Text style={styles.clear} onPress={clearFilters}>
                      Clear filters
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon={filtersActive ? 'search-outline' : 'clipboard-outline'}
              title={emptyTitle}
              message={emptyMessage}
              actionLabel={filtersActive ? 'Clear filters' : undefined}
              onAction={clearFilters}
            />
          }
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ marginVertical: 16 }} color={colors.primary} /> : null}
        />
      )}

      {user.role === 'user' ? (
        <Pressable style={styles.fab} onPress={() => navigation.navigate('CreateComplaint')} accessibilityLabel="Report a problem">
          <Ionicons name="add" size={30} color="#fff" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  filters: { backgroundColor: '#fff', paddingTop: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  searchInput: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 14, color: colors.text },
  chipRow: { flexGrow: 0, marginBottom: 0 },
  listContent: { padding: 12, paddingBottom: 90, flexGrow: 1 },
  countRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  count: { fontSize: 12, color: colors.muted },
  clear: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
});
