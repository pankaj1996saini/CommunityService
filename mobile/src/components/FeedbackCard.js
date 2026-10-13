import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import StarRating from './StarRating';
import AppInput from './AppInput';
import AppButton from './AppButton';
import { colors, radius, shadow } from '../theme';
import { formatDate } from '../utils/format';

// Shows the feedback if there is one. If the viewer is the reporter and the
// complaint is resolved with no feedback yet, shows the form instead.
export default function FeedbackCard({ feedback, canSubmit, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (feedback && feedback.rating) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Feedback</Text>
        <StarRating value={feedback.rating} size={22} />
        {feedback.comment ? <Text style={styles.comment}>{feedback.comment}</Text> : null}
        <Text style={styles.date}>{formatDate(feedback.at)}</Text>
      </View>
    );
  }

  if (!canSubmit) return null;

  const submit = async () => {
    if (!rating) {
      setError('Tap a star to rate the service');
      return;
    }
    setSaving(true);
    try {
      await onSubmit({ rating, comment: comment.trim() });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>How did we do?</Text>
      <Text style={styles.sub}>Your complaint was resolved. Let us know if you were happy with the work.</Text>
      <View style={{ marginVertical: 10 }}>
        <StarRating
          value={rating}
          onChange={(n) => {
            setRating(n);
            setError('');
          }}
        />
      </View>
      <AppInput
        value={comment}
        onChangeText={setComment}
        placeholder="Anything to add? (optional)"
        multiline
        maxLength={300}
        error={error}
      />
      <AppButton title="Submit feedback" onPress={submit} loading={saving} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, marginBottom: 14, ...shadow },
  title: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 },
  sub: { fontSize: 13, color: colors.muted },
  comment: { fontSize: 14, color: colors.text, marginTop: 8 },
  date: { fontSize: 11, color: colors.muted, marginTop: 6 },
});
