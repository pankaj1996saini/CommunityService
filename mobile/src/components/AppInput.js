import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';

export default function AppInput({ label, error, secureTextEntry, multiline, maxLength, value, style, ...rest }) {
  const [hidden, setHidden] = useState(!!secureTextEntry);
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.wrap, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.box,
          focused && { borderColor: colors.primary },
          !!error && { borderColor: colors.danger },
          multiline && { alignItems: 'flex-start' },
        ]}
      >
        <TextInput
          {...rest}
          value={value}
          maxLength={maxLength}
          multiline={multiline}
          secureTextEntry={hidden}
          onFocus={(e) => {
            setFocused(true);
            if (rest.onFocus) rest.onFocus(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            if (rest.onBlur) rest.onBlur(e);
          }}
          placeholderTextColor="#9aa3b5"
          style={[styles.input, multiline && { minHeight: 100, textAlignVertical: 'top' }]}
        />
        {secureTextEntry ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10}>
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.footer}>
        <Text style={styles.error}>{error || ''}</Text>
        {maxLength ? (
          <Text style={styles.counter}>
            {(value || '').length}/{maxLength}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 15, color: colors.text },
  footer: { flexDirection: 'row', justifyContent: 'space-between', minHeight: 18, marginTop: 3 },
  error: { color: colors.danger, fontSize: 12, flex: 1 },
  counter: { color: colors.muted, fontSize: 11 },
});
