import React from 'react';
import { act, create } from 'react-test-renderer';
import { FlashList } from '@shopify/flash-list';
import { HomeTimelineView } from '../HomeTimelineView';

const mockReset = jest.fn();
const mockQuery = { data: [], isLoading: false, hasNextPage: false, isFetchingNextPage: false, isRefetching: false, resetPagination: mockReset };
jest.mock('../../hooks/queries/useQuestionQueries', () => ({ useTimeline: () => mockQuery }));
jest.mock('@shopify/flash-list', () => ({ FlashList: (props) => require('react').createElement('List', props, props.data.length ? null : props.ListEmptyComponent) }));
jest.mock('tamagui', () => ({ YStack: 'View', useTheme: () => ({ colorMuted: { val: '#777' } }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock('@/shared/theme', () => ({ useAccentColors: () => ({ primary: '#000' }) }));
jest.mock('@/shared/utils/responsive', () => ({ fs: (n) => n, sp: (n) => n }));
jest.mock('@/shared/hooks/useThrottledCallback', () => ({ useThrottledCallback: (fn) => fn }));
jest.mock('@/features/admob/public', () => ({ useInterstitialAd: () => ({ showAd: jest.fn() }) }));
jest.mock('@/features/member/public', () => ({ useIsAdFreeMember: () => true }));
jest.mock('../../stores/useDatePickerStore', () => ({ useDatePickerStore: () => jest.fn() }));
jest.mock('../../stores/useSlideDirectionStore', () => ({ useSlideDirectionStore: () => jest.fn() }));
jest.mock('../../stores/useHomeViewStore', () => ({ useHomeViewStore: () => jest.fn() }));
jest.mock('../TimelineRow', () => ({ TimelineRow: () => null }));

it('keeps empty timelines refreshable and reflects refresh progress', async () => {
  let renderer;
  try {
    await act(async () => { renderer = create(React.createElement(HomeTimelineView)); });
    const list = renderer.root.findByType(FlashList);
    expect(list.props.data).toEqual([]);
    expect(renderer.root.findAll((node) => node.props.children === 'timeline.empty').length).toBeGreaterThan(0);
    await act(async () => list.props.onRefresh());
    expect(mockReset).toHaveBeenCalledTimes(1);
    mockQuery.isRefetching = true;
    await act(async () => renderer.update(React.createElement(HomeTimelineView)));
    expect(renderer.root.findByType(FlashList).props.refreshing).toBe(true);
  } finally {
    mockQuery.isRefetching = false;
    await act(async () => renderer?.unmount());
  }
});
