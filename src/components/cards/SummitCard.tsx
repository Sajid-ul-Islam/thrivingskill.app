import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SpringPressable } from '../common';
import { SkillsSummit } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useLearning } from '../../context/LearningContext';

interface SummitCardProps {
  summit: SkillsSummit;
}

export const SummitCard: React.FC<SummitCardProps> = ({ summit }) => {
  const { colors } = useTheme();
  const { rsvpForWorkshop, isRsvpd } = useLearning();
  const reserved = isRsvpd(summit.id);

  const handleRegister = () => {
    rsvpForWorkshop(summit.id);
    Alert.alert(
      `${summit.title} 🎟️`,
      reserved
        ? 'Your summit seat reservation is already saved on this device.'
        : 'Seat reservation saved to your device schedule!'
    );
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceCard,
          borderColor: colors.border,
          shadowColor: colors.cardShadow,
        },
      ]}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: summit.bannerImage }} style={styles.bannerImage} />
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: summit.status === 'Live' ? '#EF4444' : '#059669' },
          ]}
        >
          <View style={styles.pulseDot} />
          <Text style={styles.statusText}>{summit.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={[styles.dateText, { color: colors.secondary }]}>{summit.date}</Text>
        <Text style={[styles.title, { color: colors.text }]}>{summit.title}</Text>
        <Text style={[styles.themeText, { color: colors.primary }]}>{summit.theme}</Text>
        <Text style={[styles.description, { color: colors.textMuted }]} numberOfLines={2}>
          {summit.description}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.attendeesBox}>
            <Ionicons name="people" size={14} color={colors.textMuted} />
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
              {summit.attendeesCount}
            </Text>
          </View>

          <SpringPressable
            style={[
              styles.rsvpBtn,
              { backgroundColor: reserved ? colors.surfaceSubtle : colors.primary, borderWidth: reserved ? 1 : 0, borderColor: colors.primary },
            ]}
            onPress={handleRegister}
            activeScale={0.96}
            accessibilityRole="button"
            accessibilityLabel={reserved ? `Reserved for ${summit.title}` : `RSVP Free for ${summit.title}`}
          >
            <Text style={[styles.rsvpBtnText, { color: reserved ? colors.primary : colors.onPrimary }]}>
              {reserved ? 'Reserved ✓' : 'RSVP Free'}
            </Text>
            <Ionicons name={reserved ? 'checkmark-circle' : 'arrow-forward'} size={13} color={reserved ? colors.primary : colors.onPrimary} />
          </SpringPressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    height: 120,
    width: '100%',
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardBody: {
    padding: 14,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: 2,
  },
  themeText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  attendeesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
  },
  rsvpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  rsvpBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
