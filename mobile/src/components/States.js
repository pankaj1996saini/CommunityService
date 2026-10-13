import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppButton from './AppButton';
import { colors } from '../theme';

export function Loader({ label }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      {label ? <Text style={styles.sub}>{label}</Text> : null}
    </View>
  );
}

export function EmptyState({ icon = 'file-tray-outline', title, message, actionLabel, onAction }) {
  return (
    <View style={styles.center}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={34} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.sub}>{message}</Text> : null}
      {actionLabel ? <AppButton title={actionLabel} onPress={onAction} small style={{ marginTop: 16 }} /> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <View style={styles.center}>
      <View style={[styles.iconCircle, { backgroundColor: colors.dangerSoft }]}>
        <Ionicons name="cloud-offline-outline" size={34} color={colors.danger} />
      </View>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.sub}>{message}</Text>
      {onRetry ? <AppButton title="Try again" onPress={onRetry} variant="outline" small style={{ marginTop: 16 }} /> : null}
    </View>
  );
}

// small inline banner for when we already have data on screen but a refresh failed
export function ErrorBanner({ message, onRetry }) {
  return (
    <View style={styles.banner}>
      <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
      <Text style={styles.bannerText} numberOfLines={2}>
        {message}
      </Text>
      {onRetry ? (
        <Text style={styles.bannerLink} onPress={onRetry}>
          Retry
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, minHeight: 260 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 17, fontWeight: '700', color: colors.text, textAlign: 'center' },
  sub: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerSoft,
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  bannerText: { flex: 1, color: colors.danger, fontSize: 13, marginLeft: 8 },
  bannerLink: { color: colors.danger, fontWeight: '700', marginLeft: 8 },
});
