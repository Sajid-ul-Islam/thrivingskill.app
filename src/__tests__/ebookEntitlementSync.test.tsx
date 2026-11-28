import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  EbookModal,
  STORAGE_KEY_PURCHASED_EBOOKS,
  getEbookEntitlementStorageKey,
} from '../components/modals/EbookModal';
import { CompanionService } from '../services/api/companionService';

const mockUseAuth = jest.fn();
const mockUseLearning = jest.fn();

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@expo/vector-icons/Ionicons', () => () => null);
jest.mock('../utils/haptics', () => ({ triggerHaptic: jest.fn() }));
jest.mock('../context/ThemeContext', () => ({
  useTheme: () => ({
    isDark: false,
    colors: {
      background: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceCard: '#FFFFFF',
      surfaceSubtle: '#F8FAFC',
      border: '#E2E8F0',
      text: '#102F53',
      textMuted: '#64748B',
      primary: '#102F53',
      primaryLight: '#E8EEF5',
      onPrimary: '#FFFFFF',
      accent: '#E34234',
      onAccent: '#FFFFFF',
      cardShadow: '#102F53',
    },
  }),
}));

jest.mock('../context/LanguageContext', () => ({
  useLanguage: () => ({ isBangla: false, language: 'en' }),
}));

jest.mock('../context/FeedbackContext', () => ({
  useFeedback: () => ({ showToast: jest.fn() }),
}));

jest.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../context/LearningContext', () => ({
  useLearning: () => mockUseLearning(),
}));

jest.mock('../components/common/SpringPressable', () => {
  const ReactActual = require('react');
  const { Pressable } = require('react-native');
  return {
    SpringPressable: ({ children, onPress, ...rest }: any) =>
      ReactActual.createElement(Pressable, { onPress, ...rest }, children),
  };
});

describe('EbookModal server entitlement sync', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('ignores legacy shared AsyncStorage when unauthenticated', async () => {
    await AsyncStorage.setItem(STORAGE_KEY_PURCHASED_EBOOKS, JSON.stringify(['ebook-sales-pp']));
    mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null });
    mockUseLearning.mockReturnValue({ courses: [], userProgress: {} });
    const spy = jest.spyOn(CompanionService, 'checkServerEnrollment').mockResolvedValue(null);

    const screen = await render(<EbookModal visible={true} onClose={jest.fn()} />);

    await waitFor(() => {
      expect(screen.queryByText('Read & Download')).toBeNull();
    });
    expect(spy).not.toHaveBeenCalled();
    await screen.unmount();
    spy.mockRestore();
  });

  it('syncs server-verified entitlements by course slug and scopes offline cache per learner', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '24933', username: 'ts_qa_subscriber' },
    });
    mockUseLearning.mockReturnValue({
      courses: [{ id: '9910', slug: 'sales-ebook', title: 'Sales eBook' }],
      userProgress: {},
    });

    const spy = jest.spyOn(CompanionService, 'checkServerEnrollment').mockResolvedValue({
      enrolled: true,
      enrolledCourseIds: ['9910'],
      orderStatus: 'completed',
      paymentConfirmed: true,
    });

    const screen = await render(<EbookModal visible={true} onClose={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getAllByText('Read & Download').length).toBeGreaterThanOrEqual(1);
    });

    const scopedRaw = await AsyncStorage.getItem(getEbookEntitlementStorageKey('24933'));
    expect(scopedRaw).toBe(JSON.stringify(['ebook-sales-pp']));
    expect(await AsyncStorage.getItem(getEbookEntitlementStorageKey('99999'))).toBeNull();

    await screen.unmount();
    spy.mockRestore();
  });
});
