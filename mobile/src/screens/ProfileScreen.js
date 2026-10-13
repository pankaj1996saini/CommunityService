import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../api';
import { useAuth } from '../context/AuthContext';
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';
import { ErrorBanner } from '../components/States';
import { colors, radius, shadow } from '../theme';
import { confirmAction, showMessage } from '../utils/dialog';
import { digitsOnly, validateProfile } from '../utils/validators';

const ROLE_LABEL = { user: 'Resident', staff: 'Staff', admin: 'Administrator' };

export default function ProfileScreen() {
  const { user, setUser, logout } = useAuth();
  const [form, setForm] = useState({
    name: user.name,
    phone: user.phone || '',
    unit: user.unit || '',
    currentPassword: '',
    newPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const save = async () => {
    const found = validateProfile(form);
    setErrors(found);
    setServerError('');
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      const body = { name: form.name.trim(), phone: digitsOnly(form.phone), unit: form.unit.trim() };
      if (form.newPassword) {
        body.currentPassword = form.currentPassword;
        body.newPassword = form.newPassword;
      }
      const data = await authApi.updateMe(body);
      setUser(data.user);
      setForm((f) => ({ ...f, currentPassword: '', newPassword: '' }));
      showMessage('Saved', 'Your profile was updated.');
    } catch (err) {
      setServerError(err.message);
      if (err.details) setErrors((e) => ({ ...e, ...err.details }));
    } finally {
      setSaving(false);
    }
  };

  const confirmLogout = () => confirmAction('Log out?', 'You will need to sign in again.', logout, 'Log out');

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.head}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.name.trim().charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={styles.role}>
            <Ionicons name="shield-checkmark-outline" size={13} color={colors.primary} />
            <Text style={styles.roleText}>
              {ROLE_LABEL[user.role]}
              {user.department ? ` · ${user.department}` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your details</Text>
          {serverError ? <ErrorBanner message={serverError} /> : null}
          <AppInput label="Name" value={form.name} onChangeText={set('name')} error={errors.name} />
          <AppInput
            label="Phone"
            value={form.phone}
            onChangeText={set('phone')}
            keyboardType="phone-pad"
            maxLength={14}
            placeholder="10 digit mobile number"
            error={errors.phone}
          />
          <AppInput label="Flat / room / block" value={form.unit} onChangeText={set('unit')} placeholder="Block A, 204" />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Change password</Text>
          <AppInput
            label="Current password"
            value={form.currentPassword}
            onChangeText={set('currentPassword')}
            secureTextEntry
            error={errors.currentPassword}
          />
          <AppInput
            label="New password"
            value={form.newPassword}
            onChangeText={set('newPassword')}
            secureTextEntry
            placeholder="Leave empty to keep the current one"
            error={errors.newPassword}
          />
        </View>

        <AppButton title="Save changes" onPress={save} loading={saving} />
        <AppButton title="Log out" variant="ghost" icon="log-out-outline" onPress={confirmLogout} style={{ marginTop: 10 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, width: '100%', maxWidth: 560, alignSelf: 'center' },
  head: { alignItems: 'center', marginBottom: 18 },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 10 },
  email: { fontSize: 13, color: colors.muted, marginTop: 2 },
  role: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginTop: 8,
  },
  roleText: { color: colors.primary, fontSize: 12, fontWeight: '600', marginLeft: 5 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, marginBottom: 14, ...shadow },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 12 },
});
