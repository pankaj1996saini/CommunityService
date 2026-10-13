import { Platform } from 'react-native';
import Constants from 'expo-constants';

const API_PORT = 5000;

// Works out where the API lives so you don't have to type your LAN IP anywhere:
//  - EXPO_PUBLIC_API_URL wins if you set it
//  - on web it's whatever host the page was served from
//  - on a phone, Expo already knows your computer's address (it's the one serving the bundle)
//  - Android emulator can't see "localhost", it uses 10.0.2.2 for the host machine
function resolveApiUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  if (Platform.OS === 'web') {
    return `http://${window.location.hostname}:${API_PORT}`;
  }

  const hostUri =
    (Constants.expoConfig && Constants.expoConfig.hostUri) ||
    (Constants.expoGoConfig && Constants.expoGoConfig.debuggerHost);
  if (hostUri) {
    return `http://${hostUri.split(':')[0]}:${API_PORT}`;
  }

  return Platform.OS === 'android' ? `http://10.0.2.2:${API_PORT}` : `http://localhost:${API_PORT}`;
}

export const API_URL = resolveApiUrl();

// uploads come back as "/uploads/xyz.jpg", turn them into something an <Image> can load
export const fileUrl = (path) => (path ? (path.startsWith('http') ? path : `${API_URL}${path}`) : null);
