import axios from 'axios';
import { config } from '@/constants/config';
import { storage } from './storage';
import { AuthResponse } from '@/types/api';

/**
 * Token Refresh Mutex Service
 *
 * 여러 요청이 동시에 401을 받아도 토큰 갱신은 1번만 실행되도록 보장
 * Promise 기반 mutex 패턴 사용 (외부 라이브러리 불필요)
 */
class TokenRefreshService {
  private refreshPromise: Promise<string> | null = null;
  private isRefreshing = false;

  /**
   * 토큰 갱신 (중복 호출 방지)
   *
   * 이미 갱신 중이면 기존 Promise를 재사용하여 여러 요청이 같은 갱신을 기다림
   * Race condition 방지를 위한 동기적 guard 사용
   */
  async refresh(): Promise<string> {
    // 동기적 guard로 race condition 방지
    if (this.isRefreshing) {
      // Promise가 생성될 때까지 대기
      while (!this.refreshPromise) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      return this.refreshPromise!;
    }

    // 새로운 갱신 시작
    this.isRefreshing = true;
    this.refreshPromise = this.doRefresh();

    try {
      const token = await this.refreshPromise;
      return token;
    } finally {
      this.refreshPromise = null;
      this.isRefreshing = false;
    }
  }

  /**
   * 실제 토큰 갱신 로직
   */
  private async doRefresh(): Promise<string> {
    const refreshToken = await storage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token');
    }

    // apiClient 대신 axios 직접 사용 (인터셉터 무한 루프 방지)
    const response = await axios.post<AuthResponse>(
      `${config.apiUrl}/api/v1/auth/reissue-token`,
      { refreshToken },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000, // 5초 timeout (무한 대기 방지)
      }
    );

    const { accessToken, refreshToken: newRefreshToken } = response.data;

    // 원자적 업데이트 (토큰 불일치 방지)
    await storage.setTokens(accessToken, newRefreshToken);

    return accessToken;
  }
}

export const tokenRefreshService = new TokenRefreshService();
