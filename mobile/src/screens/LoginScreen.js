import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';
import Chip from '../components/Chip';
import { ErrorBanner } from '../components/States';
import { useAuth } from '../context/AuthContext';
import { DEMO_LOGINS } from '../constants';
import { validateLogin } from '../utils/validators';
import { colors } from '../theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const found = validateLogin({ email, password });
    setErrors(found);
    setServerError('');
    if (Object.keys(found).length) return;

    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setServerError(err.message);
      setLoading(false);
    }
  };

  const fillDemo = (d) => {
    setEmail(d.email);
    setPassword(d.password);
    setErrors({});
    setServerError('');
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.logo}>
            <Ionicons name="construct" size={34} color="#fff" />
          </View>
          <Text style={styles.title}>Community Service</Text>
          <Text style={styles.subtitle}>Report problems, track repairs, get things fixed.</Text>

          <View style={styles.form}>
            {serverError ? <ErrorBanner message={serverError} /> : null}
            <AppInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              error={errors.email}
            />
            <AppInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              secureTextEntry
              error={errors.password}
              onSubmitEditing={submit}
            />
            <AppButton title="Log in" onPress={submit} loading={loading} style={{ marginTop: 6 }} />
            <AppButton
              title="Create an account"
              variant="ghost"
              onPress={() => navigation.navigate('Register')}
              style={{ marginTop: 6 }}
            />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 24, paddingTop: 40, alignItems: 'center', width: '100%', maxWidth: 480, alignSelf: 'center' },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: 4, marginBottom: 26, textAlign: 'center' },
  form: { width: '100%' },
  demo: { width: '100%', marginTop: 28 },
  demoTitle: { fontSize: 12, color: colors.muted, marginBottom: 8 },
});
