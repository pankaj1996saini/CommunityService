import { Platform } from 'react-native';

// Builds a multipart body for the endpoints that take photos.
// React Native lets you append { uri, name, type } straight to FormData,
// but on web that doesn't work, you have to hand it a real Blob.
export async function buildForm(fields, images = [], fileField = 'images') {
  const form = new FormData();

  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') form.append(key, String(value));
  });

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const name = img.fileName || `photo-${i + 1}.jpg`;
    const type = img.mimeType || 'image/jpeg';

    if (Platform.OS === 'web') {
      const blob = await (await fetch(img.uri)).blob();
      form.append(fileField, blob, name);
    } else {
      form.append(fileField, { uri: img.uri, name, type });
    }
  }
  return form;
}
