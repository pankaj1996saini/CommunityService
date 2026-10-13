import React, { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { complaintApi } from '../api';
import { fileUrl } from '../config';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../components/Badge';
import Timeline from '../components/Timeline';
import AppButton from '../components/AppButton';
import FeedbackCard from '../components/FeedbackCard';
import ImageViewer from '../components/ImageViewer';
import AssignModal from '../components/AssignModal';
import StatusUpdateModal from '../components/StatusUpdateModal';
import { ErrorState, Loader } from '../components/States';
import { CATEGORY_ICONS } from '../constants';
import { colors, radius, shadow } from '../theme';
import { formatDateTime } from '../utils/format';
import { buildForm } from '../utils/form';
import { confirmAction, showMessage } from '../utils/dialog';

export default function ComplaintDetailScreen({ route }) {
  const { id } = route.params;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const [viewerUri, setViewerUri] = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [statusMode, setStatusMode] = useState(null); // 'progress' | 'resolve' | 'admin' | null

  const load = useCallback(async () => {
    try {
      const data = await complaintApi.get(id);
      setComplaint(data.complaint);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load().finally(() => setRefreshing(false));
  };

  if (loading) return <Loader label="Loading complaint..." />;
  if (error && !complaint) return <ErrorState message={error} onRetry={() => { setLoading(true); load().finally(() => setLoading(false)); }} />;
  if (!complaint) return null;

  const c = complaint;
  const isAdmin = user.role === 'admin';
  const isStaff = user.role === 'staff';
  const isOwner = user.role === 'user';
  const resolved = c.status === 'Resolved';

  // ---- actions

  const acceptTask = () =>
    confirmAction(
      'Accept this task?',
      'The reporter will be told that work has started.',
      async () => {
        setBusy(true);
        try {
          const data = await complaintApi.updateStatus(c._id, { status: 'In Progress' });
          setComplaint(data.complaint);
        } catch (err) {
          showMessage('Could not accept the task', err.message);
        } finally {
          setBusy(false);
        }
      },
      'Accept'
    );

  // used by the status modal (staff progress/resolve, admin change status)
  const submitStatus = async ({ status, remarks, images }) => {
    const body = images.length
      ? await buildForm({ status, remarks }, images, 'workImages')
      : { status, remarks };
    const data = await complaintApi.updateStatus(c._id, body);
    setComplaint(data.complaint);
    setStatusMode(null);
  };

  const submitAssign = async ({ staffId, priority }) => {
    let data = null;
    if (staffId && (!c.assignedTo || staffId !== c.assignedTo._id)) {
      data = await complaintApi.assign(c._id, { staffId, priority });
    } else if (priority !== c.priority) {
      data = await complaintApi.setPriority(c._id, priority);
    }
    if (data) setComplaint(data.complaint);
    setAssignOpen(false);
  };

  const submitFeedback = async (body) => {
    const data = await complaintApi.feedback(c._id, body);
    setComplaint(data.complaint);
  };

  // ---- bottom action bar

  let actions = null;
  if (isAdmin) {
    actions = (
      <>
        {!resolved ? (
          <AppButton title={c.assignedTo ? 'Reassign' : 'Assign'} icon="person-add-outline" variant="outline" onPress={() => setAssignOpen(true)} style={styles.actionBtn} />
        ) : null}
        <AppButton title="Change status" icon="swap-horizontal-outline" onPress={() => setStatusMode('admin')} style={styles.actionBtn} />
      </>
    );
  } else if (isStaff && c.assignedTo && c.assignedTo._id === user._id) {
    if (c.status === 'Assigned') {
      actions = <AppButton title="Accept task" icon="checkmark-circle-outline" onPress={acceptTask} loading={busy} style={styles.actionBtn} />;
    } else if (c.status === 'In Progress') {
      actions = (
        <>
          <AppButton title="Add update" icon="create-outline" variant="outline" onPress={() => setStatusMode('progress')} style={styles.actionBtn} />
          <AppButton title="Mark resolved" icon="checkmark-done-outline" variant="success" onPress={() => setStatusMode('resolve')} style={styles.actionBtn} />
        </>
      );
    }
  }

  const evidence = (c.images || []).map(fileUrl);
  const workPhotos = (c.workImages || []).map(fileUrl);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: actions ? 110 : 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* header */}
        <View style={styles.card}>
          <Text style={styles.ticket}>{c.ticketId}</Text>
          <Text style={styles.title}>{c.title}</Text>
          <View style={styles.badges}>
            <StatusBadge status={c.status} />
            <View style={{ width: 8 }} />
            <PriorityBadge priority={c.priority} />
          </View>
          <Text style={styles.description}>{c.description}</Text>
        </View>

        {/* facts */}
        <View style={styles.card}>
          <InfoRow icon={CATEGORY_ICONS[c.category]} label="Category" value={c.category} />
          <InfoRow icon="location-outline" label="Location" value={c.location} />
          <InfoRow icon="time-outline" label="Reported" value={formatDateTime(c.createdAt)} />
          {!isOwner && c.createdBy ? (
            <InfoRow
              icon="person-outline"
              label="Reported by"
              value={[c.createdBy.name, c.createdBy.unit, c.createdBy.phone].filter(Boolean).join(' · ')}
            />
          ) : null}
          <InfoRow
            icon="construct-outline"
            label="Assigned to"
            value={
              c.assignedTo
                ? [c.assignedTo.name, c.assignedTo.department].filter(Boolean).join(' · ')
                : 'Not assigned yet'
            }
            last
          />
        </View>

        {evidence.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Photos from the reporter</Text>
            <PhotoRow uris={evidence} onOpen={setViewerUri} />
          </View>
        ) : null}

        {workPhotos.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Work photos from staff</Text>
            <PhotoRow uris={workPhotos} onOpen={setViewerUri} />
          </View>
        ) : null}

        {/* history */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Status timeline</Text>
          <Timeline entries={c.timeline} />
        </View>

        {resolved ? <FeedbackCard feedback={c.feedback} canSubmit={isOwner} onSubmit={submitFeedback} /> : null}
      </ScrollView>

      {actions ? (
        <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>{actions}</View>
      ) : null}

      <ImageViewer uri={viewerUri} onClose={() => setViewerUri(null)} />

      <AssignModal visible={assignOpen} complaint={c} onClose={() => setAssignOpen(false)} onSubmit={submitAssign} />
      <StatusUpdateModal
        visible={!!statusMode}
        mode={statusMode}
        currentStatus={c.status}
        onClose={() => setStatusMode(null)}
        onSubmit={submitStatus}
      />
    </View>
  );
}

function InfoRow({ icon, label, value, last }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoDivider]}>
      <Ionicons name={icon || 'ellipse-outline'} size={18} color={colors.primary} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function PhotoRow({ uris, onOpen }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {uris.map((uri) => (
        <Pressable key={uri} onPress={() => onOpen(uri)} style={{ marginRight: 10 }}>
          <Image source={{ uri }} style={styles.photo} />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, marginBottom: 14, ...shadow },
  ticket: { fontSize: 12, color: colors.muted, fontWeight: '700', letterSpacing: 0.4 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 4 },
  badges: { flexDirection: 'row', marginTop: 10 },
  description: { fontSize: 15, color: colors.text, lineHeight: 22, marginTop: 14 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10 },
  infoDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel: { fontSize: 11, color: colors.muted },
  infoValue: { fontSize: 14, color: colors.text, fontWeight: '500', marginTop: 1 },
  photo: { width: 120, height: 120, borderRadius: radius.md, backgroundColor: colors.border },
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionBtn: { flex: 1, marginHorizontal: 4 },
});
