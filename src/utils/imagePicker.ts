import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export interface PickResult {
  uri: string;
  base64: string | null;
  mediaType: 'image/jpeg' | 'image/png';
}

function getMediaType(uri: string): 'image/jpeg' | 'image/png' {
  const ext = (uri.split('.').pop() ?? 'jpg').toLowerCase();
  return ext === 'png' ? 'image/png' : 'image/jpeg';
}

export async function pickFromLibrary(): Promise<PickResult | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permiso necesario', 'Necesitamos acceso a la galería para seleccionar fotos.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.6, base64: true });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  return { uri: asset.uri, base64: asset.base64 ?? null, mediaType: getMediaType(asset.uri) };
}

export async function pickFromCamera(): Promise<PickResult | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permiso necesario', 'Necesitamos acceso a la cámara para sacar fotos.');
    return null;
  }
  const result = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.6, base64: true });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  return { uri: asset.uri, base64: asset.base64 ?? null, mediaType: getMediaType(asset.uri) };
}
