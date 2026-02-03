import { MemberPermission } from '@/types/api';

export const AD_FREE_PERMISSIONS: MemberPermission[] = [MemberPermission.PREMIUM];

export const shouldHideAds = (permission?: MemberPermission | null) => {
  if (!permission) return false;
  return AD_FREE_PERMISSIONS.includes(permission);
};
