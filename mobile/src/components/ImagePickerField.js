import React from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';
import { showMessage } from '../utils/dialog';

// Lets the person attach up to `max` photos, from the gallery or the camera.
// `images` is the array of picker assets, the parent owns the state.
export default function ImagePickerField({ label = 'Photos', images, onChange, max = 3, hint }) {
  const full = images.length >= max;

  const add = (assets) => onChange([...images, ...assets].slice(0, max));

  const fromGallery = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: max - images.length > 1,
        selectionLimit: Math.max(1, max - images.length),
        quality: 0.6,
      });
      if (!res.canceled) add(res.assets);
    } catch {
      showMessage('Could not open gallery', 'Please try again.');
    }
  };

  const fromCamera = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        showMessage('Camera permission needed', 'Allow camera access in your phone settings to take a photo.');
        return;
      }
      const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6 });
      if (!res.canceled) add(res.assets);
    } catch {
      showMessage('Could not open camera', 'Please try again.');
    }
  };

  const remove = (index) => onChange(images.filter((_, i) => i !== index));

  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={styles.label}>
        {label} <Text style={styles.count}>({images.length}/{max})</Text>
      </Text>

      <View style={styles.row}>
        {images.map((img, i) => (
          <View key={img.uri + i} style={styles.thumbWrap}>
            <Image source={{ uri: img.uri }} style={styles.thumb} />
            <Pressable style={styles.remove} onPress={() => remove(i)} hitSlop={6}>
              <Ionicons name="close" size={14} color="#fff" />
            </Pressable>
          </View>
        ))}

        {!full ? (
          <>
            <Pressable style={styles.add} onPress={fromGallery}>
              <Ionicons name="images-outline" size={22} color={colors.primary} />
              <Text style={styles.addText}>Gallery</Text>
            </Pressable>
            {Platform.OS !== 'web' ? (
              <Pressable style={styles.add} onPress={fromCamera}>
                <Ionicons name="camera-outline" size={22} color={colors.primary} />
                <Text style={styles.addText}>Camera</Text>
              </Pressable>
            ) : null}
          </>
        ) : null}
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const SIZE = 78;

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 8 },
  count: { color: colors.muted, fontWeight: '400' },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  thumbWrap: { marginRight: 10, marginBottom: 10 },
  thumb: { width: SIZE, height: SIZE, borderRadius: radius.md, backgroundColor: colors.border },
  remove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  add: {
    width: SIZE,
    height: SIZE,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginBottom: 10,
  },
  addText: { fontSize: 11, color: colors.primary, marginTop: 2, fontWeight: '600' },
  hint: { fontSize: 12, color: colors.muted },
});
