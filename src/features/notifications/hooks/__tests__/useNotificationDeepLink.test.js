import React from 'react';
import { act, create } from 'react-test-renderer';
import * as Notifications from 'expo-notifications';
import { onFCMNotificationOpened, getInitialFCMNotification } from '@/platform/firebase';
import { useNotificationDeepLink } from '../useNotificationDeepLink';

jest.mock('@/platform/firebase', () => ({ onFCMNotificationOpened: jest.fn(), getInitialFCMNotification: jest.fn() }));
jest.mock('expo-notifications', () => ({ addNotificationResponseReceivedListener: jest.fn() }));
let renderer;
const onOpen = jest.fn();
function Harness(props) { useNotificationDeepLink({ ...props, onNotificationOpen: onOpen }); return null; }
beforeEach(() => {
  jest.clearAllMocks();
  onFCMNotificationOpened.mockReturnValue(jest.fn());
  getInitialFCMNotification.mockResolvedValue(null);
  Notifications.addNotificationResponseReceivedListener.mockReturnValue({ remove: jest.fn() });
});
afterEach(async () => { await act(async () => renderer?.unmount()); });

it.each(['local', 'fcm'])('defers a %s tap until OTA and navigation are ready', async (source) => {
  await act(async () => { renderer = create(React.createElement(Harness, { isAuthenticated: true, isAppReady: false })); });
  const data = { type: 'ANALYSIS_DONE', analysisId: '7' };
  await act(async () => {
    if (source === 'local') Notifications.addNotificationResponseReceivedListener.mock.calls[0][0]({ notification: { request: { content: { data } } } });
    else onFCMNotificationOpened.mock.calls[0][0]({ data });
  });
  expect(onOpen).not.toHaveBeenCalled();
  await act(async () => { renderer.update(React.createElement(Harness, { isAuthenticated: true, isAppReady: true })); });
  expect(onOpen).toHaveBeenCalledTimes(1);
  expect(onOpen).toHaveBeenCalledWith(data);
});

it('does not open a delayed initial notification after logout', async () => {
  let resolveInitial;
  getInitialFCMNotification.mockReturnValue(new Promise((resolve) => { resolveInitial = resolve; }));
  await act(async () => { renderer = create(React.createElement(Harness, { isAuthenticated: true, isAppReady: true })); });
  await act(async () => { renderer.update(React.createElement(Harness, { isAuthenticated: false, isAppReady: true })); });
  await act(async () => { resolveInitial({ data: { type: 'ANALYSIS_DONE', analysisId: '7' } }); });
  expect(onOpen).not.toHaveBeenCalled();
});
