import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { darkColors } from '../theme/colors';
import { ThriveGenHub } from '../components/home/ThriveGenHub';

jest.mock('@expo/vector-icons/Ionicons', () => {
  const ReactActual = require('react');
  const { Text } = require('react-native');
  return (props: { name: string; color?: string }) =>
    ReactActual.createElement(
      Text,
      { testID: `ionicon-${props.name}`, style: { color: props.color } },
      props.name
    );
});

jest.mock('../context/ThemeContext', () => {
  const { darkColors: mockDarkColors } = require('../theme/colors');
  return {
    useTheme: () => ({
      isDark: true,
      colors: mockDarkColors,
    }),
  };
});

jest.mock('../context/LanguageContext', () => ({
  useLanguage: () => ({
    isBangla: false,
  }),
}));

describe('ThriveGenHub pillars & dark mode icon contrast', () => {
  it('renders crisp Ionicons instead of emojis for all four pillars and uses high-contrast onPrimary on active level tab', async () => {
    await render(<ThriveGenHub onSelectCourse={jest.fn()} />);

    expect(screen.getByText('Industry Faculty').props.numberOfLines).toBe(1);
    expect(screen.getByText('Hands-on Labs').props.numberOfLines).toBe(1);
    expect(screen.getByText('Certificates').props.numberOfLines).toBe(1);
    expect(screen.getByText('Self-Paced').props.numberOfLines).toBe(1);

    expect(screen.getByTestId('ionicon-people-outline')).toBeTruthy();
    expect(screen.getByTestId('ionicon-laptop-outline')).toBeTruthy();
    expect(screen.getByTestId('ionicon-ribbon-outline')).toBeTruthy();
    expect(screen.getByTestId('ionicon-time-outline')).toBeTruthy();

    // Active tab in dark mode fills background with darkColors.primary (#FFFFFF),
    // so icon color must use darkColors.onPrimary (#102F53) rather than #FFFFFF.
    const activeTabIcon = screen.getByTestId('ionicon-apps');
    expect(activeTabIcon.props.style.color).toBe(darkColors.onPrimary);
    expect(activeTabIcon.props.style.color).not.toBe(darkColors.primary);
  });
});
