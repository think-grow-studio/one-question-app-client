import React from 'react';
import { act, create } from 'react-test-renderer';
import { Screen } from '../Screen';
import { useApiErrorStore } from '@/shared/stores/useApiErrorStore';

const mockFocusContext = React.createContext(false);
jest.mock('expo-router', () => ({
  usePathname: () => '/answer',
  useFocusEffect: (callback) => {
    const React = require('react');
    const focused = React.useContext(mockFocusContext);
    React.useEffect(() => focused ? callback() : undefined, [focused, callback]);
  },
}));
// Native presentation and styling are outside Jest; keep Screen, handler and store real.
jest.mock('tamagui', () => ({
  YStack: 'View', styled: (component) => component, useTheme: () => ({}),
}));
jest.mock('@/shared/stores/useThemeStore', () => ({ useThemeStore: () => ({ mode: 'light' }) }));
jest.mock('@/shared/ui/AlertDialog', () => ({
  AlertDialog: (props) => require('react').createElement('Dialog', props),
}));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

let renderer;
const tree = (answerFocused) => React.createElement(React.Fragment, null,
  React.createElement(mockFocusContext.Provider, { value: !answerFocused },
    React.createElement(Screen, { safeArea: false }, React.createElement(React.Fragment))),
  React.createElement(mockFocusContext.Provider, { value: answerFocused },
    React.createElement(Screen, { variant: 'modal' }, React.createElement(React.Fragment))),
);
const visibleDialogs = () => renderer.root.findAllByType('Dialog').filter((node) => node.props.visible);

afterEach(async () => {
  await act(async () => renderer?.unmount());
  useApiErrorStore.getState().hideError();
});

it('presents a global failure inside the focused answer modal, never the background screen', async () => {
  await act(async () => { renderer = create(tree(true)); });
  await act(async () => { useApiErrorStore.getState().showError('연결을 확인해주세요.'); });
  expect(visibleDialogs()).toHaveLength(1);
  const answerScreen = renderer.root.findAllByType(Screen)[1];
  expect(answerScreen.findByType('Dialog').props.visible).toBe(true);
  expect(visibleDialogs()[0].props.message).toBe('연결을 확인해주세요.');
  await act(async () => visibleDialogs()[0].props.onClose());
  expect(visibleDialogs()).toHaveLength(0);
});

it('clears the previous error on blur and shows the next failure only on the newly focused screen', async () => {
  await act(async () => { renderer = create(tree(true)); });
  await act(async () => { useApiErrorStore.getState().showError('previous'); });
  await act(async () => { renderer.update(tree(false)); });
  expect(useApiErrorStore.getState().isVisible).toBe(false);
  await act(async () => { useApiErrorStore.getState().showError('next'); });
  expect(visibleDialogs()).toHaveLength(1);
  expect(renderer.root.findAllByType(Screen)[0].findByType('Dialog').props.visible).toBe(true);
});
