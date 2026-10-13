import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import ModalSheet from './ModalSheet';
import AppInput from './AppInput';
import AppButton from './AppButton';
import Chip from './Chip';
import ImagePickerField from './ImagePickerField';
import { STATUSES } from '../constants';
import { colors } from '../theme';

// One modal for three jobs:
//   mode "progress" - staff adds a progress note (remarks required)
//   mode "resolve"  - staff marks the job done (remarks required, completion photos)
//   mode "admin"    - admin picks any status
export default function StatusUpdateModal({ visible, mode, currentStatus, onClose, onSubmit }) {
  const [status, setStatus] = useState(currentStatus);
  const [remarks, setRemarks] = useState('');
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // start fresh every time it opens
  useEffect(() => {
    if (visible) {
      setStatus(mode === 'resolve' ? 'Resolved' : mode === 'progress' ? 'In Progress' : currentStatus);
      setRemarks('');
      setImages([]);
      setError('');
      setSaving(false);
    }
  }, [visible, mode, currentStatus]);

  const titles = { progress: 'Add progress update', resolve: 'Mark as resolved', admin: 'Change status' };
  const needsRemarks = mode !== 'admin';

  const submit = async () => {
    if (needsRemarks && !remarks.trim()) {
      setError('Please describe what was done');
      return;
    }
    setSaving(true);
    try {
      await onSubmit({ status, remarks: remarks.trim(), images });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <ModalSheet visible={visible} title={titles[mode] || 'Update'} onClose={onClose}>
      {mode === 'admin' ? (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 8 }}>New status</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {STATUSES.map((s) => (
              <Chip key={s} label={s} selected={status === s} onPress={() => setStatus(s)} />
            ))}
          </View>
        </View>
      ) : null}

      <AppInput
        label={needsRemarks ? 'Remarks *' : 'Remarks (optional)'}
        value={remarks}
        onChangeText={(t) => {
          setRemarks(t);
          setError('');
        }}
        placeholder={mode === 'resolve' ? 'What did you fix?' : 'What is the current progress?'}
        multiline
        maxLength={500}
        error={error}
      />

      {mode !== 'admin' ? (
        <ImagePickerField
          label={mode === 'resolve' ? 'Work completion photos' : 'Progress photos'}
          images={images}
          onChange={setImages}
          max={3}
        />
      ) : null}

      <AppButton
        title={mode === 'resolve' ? 'Mark resolved' : 'Save update'}
        variant={mode === 'resolve' ? 'success' : 'primary'}
        onPress={submit}
        loading={saving}
        style={{ marginTop: 8 }}
      />
    </ModalSheet>
  );
}
