import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { complaintApi } from '../api';
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';
import Chip from '../components/Chip';
import ImagePickerField from '../components/ImagePickerField';
import { ErrorBanner } from '../components/States';
import { CATEGORIES, CATEGORY_ICONS } from '../constants';
import { buildForm } from '../utils/form';
import { showMessage } from '../utils/dialog';
import { validateComplaint } from '../utils/validators';
import { colors } from '../theme';

export default function CreateComplaintScreen({ navigation }) {
  const [form, setForm] = useState({ title: '', category: '', location: '', description: '' });
  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const submit = async () => {
    const found = validateComplaint(form);
    setErrors(found);
    setServerError('');
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      const body = await buildForm(
        {
          title: form.title.trim(),
          category: form.category,
          location: form.location.trim(),
          description: form.description.trim(),
        },
        images,
        'images'
      );
      const { complaint } = await complaintApi.create(body);
      showMessage('Complaint submitted', `Your ticket ID is ${complaint.ticketId}. You can follow it from the list.`);
      // replace, so the back button goes to the list rather than back into an empty form
      navigation.replace('ComplaintDetail', { id: complaint._id });
    } catch (err) {
      setServerError(err.message);
      if (err.details) setErrors((e) => ({ ...e, ...err.details }));
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {serverError ? <ErrorBanner message={serverError} /> : null}

        <AppInput
          label="What is the problem? *"
          value={form.title}
          onChangeText={set('title')}
          placeholder="e.g. Water leaking from ceiling"
          maxLength={100}
          error={errors.title}
        />

        <Text style={styles.label}>Category *</Text>
        <View style={styles.chips}>
          {CATEGORIES.map((c) => (
            <Chip key={c} label={c} icon={CATEGORY_ICONS[c]} selected={form.category === c} onPress={() => set('category')(c)} />
          ))}
        </View>
        <Text style={styles.catError}>{errors.category || ''}</Text>

        <AppInput
          label="Where is it? *"
          value={form.location}
          onChangeText={set('location')}
          placeholder="Block, floor, room or landmark"
          error={errors.location}
        />

        <AppInput
          label="Describe it *"
          value={form.description}
          onChangeText={set('description')}
          placeholder="What happened, since when, anything that would help the staff"
          multiline
          maxLength={1000}
          error={errors.description}
        />

        <ImagePickerField
          label="Photos (optional)"
          images={images}
          onChange={setImages}
          max={3}
          hint="A clear photo helps staff find and fix the problem faster."
        />

        <AppButton title="Submit complaint" onPress={submit} loading={saving} style={{ marginTop: 14 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, width: '100%', maxWidth: 560, alignSelf: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  catError: { color: colors.danger, fontSize: 12, minHeight: 18, marginBottom: 4 },
});
