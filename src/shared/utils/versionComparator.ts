/**
 * Semantic 버전 비교 (예: "1.2.3")
 * @returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;

    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }

  return 0;
}

/**
 * 현재 버전이 최소 요구 버전을 만족하는지 확인
 */
export function meetsMinVersion(currentVersion: string, minVersion: string): boolean {
  return compareVersions(currentVersion, minVersion) >= 0;
}

/**
 * 더 새로운 버전이 있는지 확인
 */
export function hasNewerVersion(currentVersion: string, latestVersion: string): boolean {
  return compareVersions(currentVersion, latestVersion) < 0;
}
