import React from 'react';
import { Alert, Linking } from 'react-native';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { PaymentModal } from '../components/modals/PaymentModal';
import { CoursesService } from '../services/api/coursesService';
import { Course } from '../types';

let capturedWebViewProps: any = null;

jest.mock('react-native-webview', () => {
  const ReactActual = require('react');
  const { View } = require('react-native');
  return {
    WebView: ReactActual.forwardRef((props: any, _ref: any) => {
      capturedWebViewProps = props;
      return ReactActual.createElement(View, { testID: 'mock-checkout-webview' });
    }),
  };
});

jest.mock('@expo/vector-icons/Ionicons', () => {
  const ReactActual = require('react');
  const { Text } = require('react-native');
  return (props: any) => ReactActual.createElement(Text, null, props.name);
});

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../context/ThemeContext', () => ({
  useTheme: () => ({
    isDark: false,
    colors: {
      surface: '#FFFFFF',
      surfaceSubtle: '#F8FAFC',
      border: '#E2E8F0',
      text: '#0F172A',
      textMuted: '#64748B',
      primary: '#102F53',
      primaryLight: '#E0F2FE',
      onPrimary: '#FFFFFF',
    },
  }),
}));

jest.mock('../context/LanguageContext', () => ({
  useLanguage: () => ({
    isBangla: false,
    t: (key: string) => key,
  }),
}));

const mockUpdateUserProfile = jest.fn(async () => undefined);
const mockSetAuthModalVisible = jest.fn();

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: {
      id: 42,
      username: 'learner42',
      email: 'learner42@example.com',
      displayName: 'Tariqul Islam',
      first_name: 'Tariqul',
      last_name: 'Islam',
      phone: '01711223344',
      city: 'Dhaka',
    },
    setAuthModalVisible: mockSetAuthModalVisible,
    updateUserProfile: mockUpdateUserProfile,
  }),
}));

const mockEnrollInCourse = jest.fn();
const mockConfirmServerEnrollments = jest.fn();
const mockRefreshCourses = jest.fn(async () => undefined);
const mockLoadCourseDetail = jest.fn(async () => null);

jest.mock('../context/LearningContext', () => ({
  useLearning: () => ({
    courses: [],
    userProgress: {},
    enrollInCourse: mockEnrollInCourse,
    confirmServerEnrollments: mockConfirmServerEnrollments,
    refreshCourses: mockRefreshCourses,
    loadCourseDetail: mockLoadCourseDetail,
  }),
}));

jest.mock('../theme/responsive', () => ({
  useResponsive: () => ({ isTablet: false }),
}));

jest.mock('../services/api/coursesService', () => ({
  CoursesService: {
    getWooCommerceProductPricing: jest.fn(),
    enrollCourse: jest.fn(async () => ({ success: false })),
    verifyServerEnrollment: jest.fn(async () => ({
      enrolled: false,
      enrolledCourseIds: [],
      reason: 'not_enrolled',
    })),
  },
}));

const sampleCourse: Course = {
  id: '88180',
  title: 'Generative AI for Professionals',
  slug: 'generative-ai-professionals',
  subtitle: 'Executive AI Skills',
  description: 'Course description',
  category: 'generative-ai',
  instructor: {
    id: 'inst-1',
    name: 'Dr. Mentor',
    title: 'AI Lead',
    company: 'Thriving Skills',
    avatar: '',
    bio: 'Bio',
    rating: 4.9,
    studentsCount: 1200,
    coursesCount: 4,
  },
  rating: 4.9,
  reviewsCount: 55,
  enrolledCount: 800,
  durationHours: 6,
  lecturesCount: 14,
  certificateIncluded: true,
  language: 'English',
  lastUpdated: '2026-01-10',
  level: 'Beginner',
  price: 25,
  originalPrice: 50,
  priceBdt: 1500,
  originalPriceBdt: 3000,
  thumbnail: 'https://thrivingskill.com/course.jpg',
  highlights: [],
  prerequisites: [],
  modules: [],
  reviews: [],
};

describe('PaymentModal (Issue 14 checkout hardening)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedWebViewProps = null;
    (CoursesService.getWooCommerceProductPricing as jest.Mock).mockResolvedValue({
      id: '88180',
      priceBdt: 1850,
      originalPriceBdt: 3000,
      discountPercent: 38,
      bundledCourseIds: [],
    });
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('defaults terms unchecked, blocks checkout until explicitly ticked, and omits guest password & unverifiable claims', async () => {
    const onClose = jest.fn();
    const onSuccess = jest.fn();

    await render(
      <PaymentModal visible={true} course={sampleCourse} onClose={onClose} onSuccess={onSuccess} />
    );

    await waitFor(() => {
      expect(CoursesService.getWooCommerceProductPricing).toHaveBeenCalledWith('88180');
    });

    // Live WooCommerce price is rendered rather than USD*120 (25*120=3000)
    await waitFor(() => {
      expect(screen.getAllByText(/1,?850/).length).toBeGreaterThan(0);
    });

    // Dead guest password UI and unverifiable 256-bit security claim are removed
    expect(screen.queryByText(/Account Password/i)).toBeNull();
    expect(screen.queryByText(/256-Bit Bank Grade/i)).toBeNull();

    // Terms checkbox MUST default to unchecked
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.props.accessibilityState?.checked).toBe(false);

    // Tapping Proceed before checking terms must block WebView launch and show validation alert
    await fireEvent.press(screen.getByRole('button', { name: 'Proceed to Secure Checkout' }));
    expect(Alert.alert).toHaveBeenCalled();
    expect(capturedWebViewProps).toBeNull();

    // Explicitly tick terms checkbox
    await fireEvent.press(checkbox);
    expect(screen.getByRole('checkbox').props.accessibilityState?.checked).toBe(true);

    // Now Proceed opens the WebView drawer
    await fireEvent.press(screen.getByRole('button', { name: 'Proceed to Secure Checkout' }));
    await waitFor(() => {
      expect(capturedWebViewProps).not.toBeNull();
    });
  });

  it('enforces strict WebView originWhitelist, no #terms auto-tick, origin-checked onMessage, scheme allowlist, and single onSuccess invocation', async () => {
    const canOpenSpy = jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    const openUrlSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      if (buttons && buttons[0]?.onPress) {
        buttons[0].onPress();
      }
    });

    const onClose = jest.fn();
    const onSuccess = jest.fn();

    await render(
      <PaymentModal visible={true} course={sampleCourse} onClose={onClose} onSuccess={onSuccess} />
    );

    await waitFor(() => {
      expect(CoursesService.getWooCommerceProductPricing).toHaveBeenCalled();
    });

    await fireEvent.press(screen.getByRole('checkbox'));
    await fireEvent.press(screen.getByRole('button', { name: 'Proceed to Secure Checkout' }));

    await waitFor(() => {
      expect(capturedWebViewProps).not.toBeNull();
    });

    // Tightened originWhitelist (no wildcard https://*)
    expect(capturedWebViewProps.originWhitelist).not.toContain('https://*');
    expect(capturedWebViewProps.originWhitelist).toContain('https://thrivingskill.com');

    // Injected JS does NOT auto-tick #terms or use brittle hideSelectors DOM hacks
    expect(capturedWebViewProps.injectedJavaScript).not.toContain('terms.checked');
    expect(capturedWebViewProps.injectedJavaScript).not.toContain('hideSelectors');

    // Scheme allowlist: block unknown schemes, allow bKash scheme
    const evilDecision = capturedWebViewProps.onShouldStartLoadWithRequest({ url: 'evil://steal' });
    expect(evilDecision).toBe(false);
    expect(openUrlSpy).not.toHaveBeenCalled();

    const jsDecision = capturedWebViewProps.onShouldStartLoadWithRequest({
      url: 'javascript:alert(1)',
    });
    expect(jsDecision).toBe(false);

    const bkashDecision = capturedWebViewProps.onShouldStartLoadWithRequest({
      url: 'bkash://pay?amount=1850',
    });
    expect(bkashDecision).toBe(false);
    await waitFor(() => {
      expect(canOpenSpy).toHaveBeenCalledWith('bkash://pay?amount=1850');
      expect(openUrlSpy).toHaveBeenCalledWith('bkash://pay?amount=1850');
    });

    // onMessage from untrusted origin MUST be ignored
    await act(async () => {
      capturedWebViewProps.onMessage({
        nativeEvent: {
          url: 'https://evil.example.com/checkout',
          data: JSON.stringify({
            type: 'CHECKOUT_FIELD_AUTO_DETECT',
            field: 'billing_phone',
            value: '01999999999',
          }),
        },
      });
    });
    expect(screen.queryByLabelText('Phone number')?.props.value ?? '01711223344').not.toBe(
      '01999999999'
    );

    // Unpaid/failed order-received redirect MUST keep course locked (never unlock locally!)
    (CoursesService.verifyServerEnrollment as jest.Mock).mockResolvedValueOnce({
      enrolled: false,
      enrolledCourseIds: [],
      orderStatus: 'failed',
      reason: 'payment_failed',
    });

    await act(async () => {
      await capturedWebViewProps.onNavigationStateChange({
        url: 'https://thrivingskill.com/checkout/order-received/997/?key=wc_order_failed',
        canGoBack: true,
      });
    });

    expect(CoursesService.verifyServerEnrollment).toHaveBeenCalledWith('88180', {
      orderId: '997',
      orderKey: 'wc_order_failed',
    });
    expect(mockConfirmServerEnrollments).not.toHaveBeenCalled();
    expect(mockEnrollInCourse).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();

    // Server-confirmed completion unlocks ONLY server-confirmed course IDs and calls onSuccess ONCE
    (CoursesService.verifyServerEnrollment as jest.Mock).mockResolvedValue({
      enrolled: true,
      enrolledCourseIds: ['88180', '88181'],
      orderStatus: 'completed',
    });

    await fireEvent.press(screen.getByRole('button', { name: 'Proceed to Secure Checkout' }));
    await waitFor(() => {
      expect(capturedWebViewProps).not.toBeNull();
    });

    await act(async () => {
      capturedWebViewProps.onNavigationStateChange({
        url: 'https://thrivingskill.com/checkout/order-received/998/?key=wc_order_xyz',
        canGoBack: true,
      });
      capturedWebViewProps.onNavigationStateChange({
        url: 'https://thrivingskill.com/checkout/order-received/998/?key=wc_order_xyz',
        canGoBack: true,
      });
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
    expect(onSuccess).toHaveBeenCalledWith('88180');
    expect(mockConfirmServerEnrollments).toHaveBeenCalledTimes(1);
    expect(mockConfirmServerEnrollments).toHaveBeenCalledWith(['88180', '88181']);
    expect(mockEnrollInCourse).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalled();

    canOpenSpy.mockRestore();
    openUrlSpy.mockRestore();
  });
});
