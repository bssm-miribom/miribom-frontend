// 웹: localStorage 대신 sessionStorage. 탭을 닫으면 지워지고 다른 탭과 공유 안 됨
// (XSS에는 둘 다 취약하므로 화면에서 서버 문자열을 HTML로 넣지 않는 것 유지)
const KEY = 'miribom.session';

export async function readSession(): Promise<string | null> {
  try {
    return window.sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export async function writeSession(value: string): Promise<void> {
  try {
    window.sessionStorage.setItem(KEY, value);
  } catch {}
}

export async function removeSession(): Promise<void> {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {}
}
