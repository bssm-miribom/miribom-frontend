import { Platform, Share } from 'react-native';

/** 지금 화면 링크 공유. 웹은 공유 시트가 없으면 주소 복사. 결과 문구를 돌려줌 */
export async function shareLink(title: string, path?: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    const url = path ? new URL(path, window.location.origin).toString() : window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return null;
      }
      await navigator.clipboard.writeText(url);
      return '링크를 복사했어요';
    } catch {
      return null;
    }
  }
  try {
    await Share.share({ message: title });
  } catch {}
  return null;
}
