import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';
import { ErrorBanner } from '../components/States';
import { useAuth } from '../context/AuthContext';
import { digitsOnly, validateRegister } from '../utils/validators';
import { colors } from '../theme';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', unit: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const submit = async () => {
    const found = validateRegister(form);
    setErrors(found);
    setServerError('');
    if (Object.keys(found).length) return;

    setLoading(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: digitsOnly(form.phone),
        unit: form.unit.trim(),
        password: form.password,
      });
      // AuthContext flips the navigator over to the main app, nothing else to do here
    } catch (err) {
      setServerError(err.message);
      if (err.details) setErrors((e) => ({ ...e, ...err.details }));
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>Create a resident account to report issues and follow their progress.</Text>
        <View style={styles.form}>
          {serverError ? <ErrorBanner message={serverError} /> : null}
          <AppInput label="Full name" value={form.name} onChangeText={set('name')} placeholder="Asha Verma" error={errors.name} />
          <AppInput
            label="Email"
            value={form.email}
            onChangeText={set('email')}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            error={errors.email}
          />
          <AppInput
            label="Phone (optional)"
            value={form.phone}
            onChangeText={set('phone')}
            placeholder="10 digit mobile number"
            keyboardType="phone-pad"
            maxLength={14}
            error={errors.phone}
          />
          <AppInput
            label="Flat / room / block (optional)"
            value={form.unit}
            onChangeText={set('unit')}
            placeholder="Block A, 204"
            error={errors.unit}
          />
          <AppInput
            label="Password"
            value={form.password}
            onChangeText={set('password')}
            placeholder="At least 6 characters"
            secureTextEntry
            error={errors.password}
          />
          <AppInput
            label="Confirm password"
            value={form.confirm}
            onChangeText={set('confirm')}
            placeholder="Type it again"
            secureTextEntry
            error={errors.confirm}
          />
          <AppButton title="Create account" onPress={submit} loading={loading} style={{ marginTop: 6 }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, width: '100%', maxWidth: 480, alignSelf: 'center' },
  intro: { fontSize: 14, color: colors.muted, marginBottom: 16 },
  form: { width: '100%' },
});
