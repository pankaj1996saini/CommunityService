import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ModalSheet from './ModalSheet';
import AppButton from './AppButton';
import Chip from './Chip';
import { Loader, ErrorState } from './States';
import { PRIORITIES } from '../constants';
import { userApi } from '../api';
import { colors, radius } from '../theme';

// Admin picks a staff member and (optionally) changes the priority.
export default function AssignModal({ visible, complaint, onClose, onSubmit }) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [staffId, setStaffId] = useState(null);
  const [priority, setPriority] = useState('Medium');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadStaff = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await userApi.staff();
      setStaff(data.items);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && complaint) {
      setStaffId(complaint.assignedTo ? complaint.assignedTo._id : null);
      setPriority(complaint.priority);
      setError('');
      setSaving(false);
      loadStaff();
    }
  }, [visible, complaint]);

  const submit = async () => {
    setSaving(true);
    try {
      await onSubmit({ staffId, priority });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <ModalSheet visible={visible} title="Assign & prioritise" onClose={onClose}>
      <Text style={styles.label}>Priority</Text>
      <View style={styles.wrap}>
        {PRIORITIES.map((p) => (
          <Chip key={p} label={p} selected={priority === p} onPress={() => setPriority(p)} />
        ))}
      </View>

      <Text style={[styles.label, { marginTop: 8 }]}>Assign to</Text>
      {loading ? (
        <Loader />
      ) : loadError ? (
        <ErrorState message={loadError} onRetry={loadStaff} />
      ) : staff.length === 0 ? (
        <Text style={styles.muted}>No active staff yet. Add some from the People tab first.</Text>
      ) : (
        staff.map((s) => {
          const selected = staffId === s._id;
          return (
            <Pressable key={s._id} onPress={() => setStaffId(s._id)} style={[styles.row, selected && styles.rowSelected]}>
              <Ionicons
                name={selected ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={selected ? colors.primary : colors.muted}
              />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.name}>{s.name}</Text>
                <Text style={styles.muted}>{s.department || 'General'}</Text>
              </View>
              <Text style={styles.load}>{s.workload} active</Text>
            </Pressable>
          );
        })
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <AppButton
        title="Save"
        onPress={submit}
        loading={saving}
        disabled={!staffId && !complaint?.assignedTo}
        style={{ marginTop: 14 }}
      />
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 8,
  },
  rowSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  muted: { fontSize: 12, color: colors.muted },
  load: { fontSize: 12, color: colors.muted },
  error: { color: colors.danger, fontSize: 13, marginTop: 6 },
});
