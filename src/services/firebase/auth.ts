import auth from '@react-native-firebase/auth';

/**
 * Firebase Authentication Helper
 *
 * 익명 로그인 및 Firebase 인증 세션 관리
 */

// 익명 로그인 → Firebase ID Token 반환 (기존 세션이 있으면 재사용)
export async function signInAnonymously(): Promise<string> {
  const currentUser = auth().currentUser;

  // 기존 익명 사용자가 있으면 재사용
  if (currentUser?.isAnonymous) {
    const idToken = await currentUser.getIdToken(true);
    return idToken;
  }

  // 새 익명 사용자 생성
  const credential = await auth().signInAnonymously();
  const idToken = await credential.user.getIdToken();
  return idToken;
}

// 현재 Firebase 사용자가 익명인지 확인
export function isFirebaseAnonymousUser(): boolean {
  return auth().currentUser?.isAnonymous ?? false;
}

// Firebase 로그아웃
export async function signOutFirebase(): Promise<void> {
  await auth().signOut();
}

// 현재 Firebase 사용자 (디버깅용)
export function getCurrentFirebaseUser() {
  return auth().currentUser;
}
