import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface CountdownWidgetProps {
  onClaimDiscount?: () => void;
}

export const CountdownWidget: React.FC<CountdownWidgetProps> = ({ onClaimDiscount }) => {
  const { colors, isDark } = useTheme();

  // Target date set to 3 days and 8 hours from today
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({
    days: 3,
    hours: 8,
    minutes: 45,
    seconds: 18,
  });

  useEffect(() => {
    const target = new Date();
    target.setDate(target.getDate() + 3);
    target.setHours(target.getHours() + 8);

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = target.getTime() - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatUnit = (num: number) => String(num).padStart(2, '0');

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#14223B' : '#102F53', // Deep Brand Navy
          borderColor: isDark ? '#22365A' : '#1D4476',
        },
      ]}
    >
      {/* Top Banner Row */}
      <View style={styles.topRow}>
        <View style={styles.livePill}>
          <View style={styles.pulseDot} />
          <Text style={styles.liveText}>FLASH DEAL • 40% OFF</Text>
        </View>
        <View style={styles.urgencyPill}>
          <Ionicons name="flame" size={13} color="#FFB606" />
          <Text style={styles.urgencyText}>12 Seats Left</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>Bangladesh Skills Summit 2026</Text>
      <Text style={styles.subtitle}>
        Super Early-Bird executive passes expire once countdown ends.
      </Text>

      {/* Countdown Digits */}
      <View style={styles.digitsRow}>
        <View style={styles.digitBox}>
          <Text style={styles.digitNumber}>{formatUnit(timeLeft.days)}</Text>
          <Text style={styles.digitLabel}>DAYS</Text>
        </View>
        <Text style={styles.separator}>:</Text>

        <View style={styles.digitBox}>
          <Text style={styles.digitNumber}>{formatUnit(timeLeft.hours)}</Text>
          <Text style={styles.digitLabel}>HOURS</Text>
        </View>
        <Text style={styles.separator}>:</Text>

        <View style={styles.digitBox}>
          <Text style={styles.digitNumber}>{formatUnit(timeLeft.minutes)}</Text>
          <Text style={styles.digitLabel}>MINS</Text>
        </View>
        <Text style={styles.separator}>:</Text>

        <View style={styles.digitBox}>
          <Text style={[styles.digitNumber, { color: '#FFB606' }]}>
            {formatUnit(timeLeft.seconds)}
          </Text>
          <Text style={styles.digitLabel}>SECS</Text>
        </View>
      </View>

      {/* Action CTA Button */}
      <TouchableOpacity
        style={[styles.claimButton, { backgroundColor: colors.accent }]}
        onPress={onClaimDiscount}
        activeOpacity={0.88}
      >
        <Ionicons name="ticket-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
        <Text style={styles.claimButtonText}>Reserve 40% Off Pass</Text>
        <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(227, 66, 52, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#E34234',
  },
  liveText: {
    color: '#FF7062',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  urgencyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  urgencyText: {
    color: '#FFB606',
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 14,
  },
  digitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  digitBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 54,
  },
  digitNumber: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  digitLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  separator: {
    color: '#CBD5E1',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 12,
    shadowColor: '#E34234',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  claimButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
