import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { API_BASE_URL, getAccessToken } from './api';

/**
 * Download a PDF from the backend (authenticated) and open the share sheet.
 */
export async function downloadAndSharePdf(path: string, filename: string): Promise<void> {
  const token = getAccessToken();
  const fileUri = `${FileSystem.cacheDirectory}${filename}`;

  const result = await FileSystem.downloadAsync(`${API_BASE_URL}${path}`, fileUri, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (result.status !== 200) {
    throw new Error(`PDF download failed (HTTP ${result.status})`);
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(result.uri, {
      mimeType: 'application/pdf',
      dialogTitle: filename,
    });
  } else {
    throw new Error('Sharing is not available on this device');
  }
}
