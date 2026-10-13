import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { userApi } from '../api';
import AppButton from '../components/AppButton';
import AppInput from '../components/AppInput';
import Chip from '../components/Chip';
import ModalSheet from '../components/ModalSheet';
import { EmptyState, ErrorBanner, ErrorState, Loader } from '../components/States';
import { colors, radius, shadow } from '../theme';
import { showMessage } from '../utils/dialog';
import { digitsOnly, validateStaffForm } from '../utils/validators';

const EMPTY_FORM = { name: '', email: '', phone: '', unit: '', department: '', password: '' };

// Admin screen for looking after staff and resident accounts.
export default function ManageUsersScreen() {
  const [role, setRole] = useState('staff'); // 'staff' | 'user'
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [editing, setEditing] = useState(null); // null = closed, {} = new, user = edit
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    try {
      const data = await userApi.list({ role, q });
      setItems(data.items);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [role, q]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load().finally(() => setRefreshing(false));
  };

  const openNew = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setFormError('');
    setEditing({});
  };

  const openEdit = (u) => {
    setForm({
      name: u.name,
      email: u.email,
      phone: u.phone || '',
      unit: u.unit || '',
      department: u.department || '',
      password: '',
    });
    setErrors({});
    setFormError('');
    setEditing(u);
  };

  const isNew = editing && !editing._id;

  const save = async () => {
    const found = validateStaffForm(form, isNew);
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        phone: digitsOnly(form.phone),
        unit: form.unit.trim(),
        department: form.department.trim(),
      };
      if (form.password) body.password = form.password;

      if (isNew) {
        await userApi.create({ ...body, email: form.email.trim(), role });
      } else {
        await userApi.update(editing._id, body);
      }
      setEditing(null);
      load();
    } catch (err) {
      setFormError(err.message);
      if (err.details) setErrors((e) => ({ ...e, ...err.details }));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u, value) => {
    // flip it on screen straight away, put it back if the server says no
    setItems((prev) => prev.map((x) => (x._id === u._id ? { ...x, active: value } : x)));
    try {
      await userApi.update(u._id, { active: value });
    } catch (err) {
      setItems((prev) => prev.map((x) => (x._id === u._id ? { ...x, active: !value } : x)));
      showMessage('Could not update', err.message);
    }
  };

  const set = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const label = role === 'staff' ? 'staff member' : 'resident';

  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <View style={{ flexDirection: 'row' }}>
          <Chip label="Staff" selected={role === 'staff'} onPress={() => setRole('staff')} />
          <Chip label="Residents" selected={role === 'user'} onPress={() => setRole('user')} />
        </View>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search name, email or unit"
            placeholderTextColor="#9aa3b5"
            style={styles.searchInput}
          />
        </View>
      </View>

      {loading ? (
        <Loader />
      ) : error && items.length === 0 ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(u) => u._id}
          contentContainerStyle={{ padding: 12, paddingBottom: 90, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          ListHeaderComponent={error ? <ErrorBanner message={error} onRetry={load} /> : null}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title={q ? 'No matches' : `No ${role === 'staff' ? 'staff' : 'residents'} yet`}
              message={q ? 'Try a different search.' : role === 'staff' ? 'Add your first staff member with the button below.' : 'Residents appear here once they sign up.'}
            />
          }
          renderItem={({ item: u }) => (
            <Pressable onPress={() => openEdit(u)} style={[styles.row, !u.active && { opacity: 0.6 }]}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{u.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{u.name}</Text>
                <Text style={styles.sub} numberOfLines={1}>
                  {u.email}
                </Text>
                <Text style={styles.sub} numberOfLines={1}>
                  {role === 'staff' ? u.department || 'No department' : u.unit || 'No unit given'}
                  {u.active ? '' : '  ·  deactivated'}
                </Text>
              </View>
              <Switch
                value={u.active}
                onValueChange={(v) => toggleActive(u, v)}
                trackColor={{ true: colors.primary, false: '#c9cfdc' }}
              />
            </Pressable>
          )}
        />
      )}

      <Pressable style={styles.fab} onPress={openNew}>
        <Ionicons name="person-add-outline" size={20} color="#fff" />
        <Text style={styles.fabText}>Add {label}</Text>
      </Pressable>

      <ModalSheet visible={!!editing} title={isNew ? `Add ${label}` : `Edit ${label}`} onClose={() => setEditing(null)}>
        {formError ? <ErrorBanner message={formError} /> : null}
        <AppInput label="Name" value={form.name} onChangeText={set('name')} error={errors.name} />
        <AppInput
          label="Email"
          value={form.email}
          onChangeText={set('email')}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
          editable={!!isNew}
          error={errors.email}
        />
        <AppInput
          label="Phone"
          value={form.phone}
          onChangeText={set('phone')}
          keyboardType="phone-pad"
          maxLength={14}
          error={errors.phone}
        />
        {role === 'staff' ? (
          <AppInput label="Department" value={form.department} onChangeText={set('department')} placeholder="Plumbing, Electrical..." />
        ) : (
          <AppInput label="Flat / room / block" value={form.unit} onChangeText={set('unit')} />
        )}
        <AppInput
          label={isNew ? 'Password' : 'New password (optional)'}
          value={form.password}
          onChangeText={set('password')}
          secureTextEntry
          placeholder={isNew ? 'At least 6 characters' : 'Leave empty to keep the current one'}
          error={errors.password}
        />
        <AppButton title={isNew ? 'Create account' : 'Save changes'} onPress={save} loading={saving} style={{ marginTop: 6 }} />
      </ModalSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: { backgroundColor: '#fff', padding: 12, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  searchInput: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 14, color: colors.text },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 8,
    ...shadow,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: colors.primary, fontWeight: '700', fontSize: 17 },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  sub: { fontSize: 12, color: colors.muted, marginTop: 1 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    height: 48,
    borderRadius: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fabText: { color: '#fff', fontWeight: '700', marginLeft: 8 },
});
