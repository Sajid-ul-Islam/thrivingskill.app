import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Linking, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SpringPressable } from '../common';
import { Workshop } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useLearning } from '../../context/LearningContext';
import { useFeedback } from '../../context/FeedbackContext';
import { MIN_TOUCH_TARGET } from '../../theme/typography';
import { getSafeImageSource } from '../../utils/imageUtils';

interface LiveWorkshopCardProps {
  workshop: Workshop;
  onPress?: () => void;
}

export const LiveWorkshopCard: React.FC<LiveWorkshopCardProps> = ({ workshop }) => {
  const { colors } = useTheme();
  const { isBangla } = useLanguage();
  const { isRsvpd, toggleWorkshopRsvp } = useLearning();
  const { showToast } = useFeedback();
  const registered = isRsvpd(workshop.id);
  const [thumbError, setThumbError] = useState(false);

  useEffect(() => {
    setThumbError(false);
  }, [workshop.thumbnail]);

  const fallbackIcon = require('../../../assets/icon.png');
  const imageSource = thumbError || !workshop.thumbnail
    ? fallbackIcon
    : getSafeImageSource(workshop.thumbnail, fallbackIcon);

  const bdtPrice = workshop.priceBdt || (workshop.price > 0 ? Math.round(workshop.price * 120) : 0);
  const isFree = bdtPrice === 0 && (!workshop.price || workshop.price === 0);

  const handleToggleRsvp = () => {
    const nowRegistered = toggleWorkshopRsvp(workshop.id);
    showToast({
      message: nowRegistered
        ? `Seat reserved for "${workshop.title}"`
        : `Reservation cancelled for "${workshop.title}"`,
      type: nowRegistered ? 'success' : 'info',
      actionLabel: 'Undo',
      onAction: () => {
        toggleWorkshopRsvp(workshop.id);
      },
    });
  };

  const handleJoinLive = async () => {
    const targetUrl = workshop.joinUrl || 'https://thrivingskill.com/live-room';
    try {
      showToast({
        message: isBangla ? 'লাইভ সেশনে যুক্ত করা হচ্ছে...' : 'Entering live classroom...',
        type: 'info',
      });
      await Linking.openURL(targetUrl);
    } catch {
      showToast({
        message: isBangla ? 'লাইভ লিংক খোলা যায়নি' : 'Unable to launch live class URL',
        type: 'error',
      });
    }
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
      <View style={styles.imageWrapper}>
        <Image
          source={imageSource}
          style={[styles.thumbnail, (thumbError || !workshop.thumbnail) && { resizeMode: 'contain' }]}
          onError={() => setThumbError(true)}
          {...(Platform.OS === 'web' ? { referrerPolicy: 'no-referrer' } : {})}
        />
        <View style={styles.badgeRow}>
          <View style={[styles.liveBadge, workshop.isLive && styles.liveBadgeActive]}>
            <View style={[styles.pulseDot, workshop.isLive && styles.pulseDotLive]} />
            <Text style={styles.liveText} numberOfLines={1}>
              {workshop.isLive
                ? (isBangla ? 'সরাসরি লাইভ' : '🔴 LIVE BROADCASTING')
                : (isBangla ? 'আসন্ন ওয়ার্কশপ' : 'UPCOMING WORKSHOP')}
            </Text>
          </View>

          {workshop.isLive && (workshop.liveViewerCount ?? 0) > 0 ? (
            <View style={styles.viewersBadge}>
              <Ionicons name="eye" size={12} color="#FFFFFF" />
              <Text style={styles.seatsText} numberOfLines={1}>
                {workshop.liveViewerCount} {isBangla ? 'জন লাইভে' : 'Watching'}
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.seatsBadge,
                workshop.seatsLeft <= 5 && { backgroundColor: '#DC2626' },
              ]}
            >
              <Ionicons
                name={workshop.seatsLeft <= 5 ? 'flame' : 'people'}
                size={12}
                color="#FFFFFF"
              />
              <Text style={styles.seatsText} numberOfLines={1}>
                {workshop.seatsLeft <= 5
                  ? (isBangla ? `বাকি মাত্র ${workshop.seatsLeft}টি সিট!` : `Only ${workshop.seatsLeft} seats left!`)
                  : (isBangla ? `${workshop.seatsLeft}টি সিট খালি` : `${workshop.seatsLeft} seats left`)}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {workshop.title}
        </Text>
        <Text style={[styles.description, { color: colors.textMuted }]} numberOfLines={2}>
          {workshop.description}
        </Text>

        <View style={[styles.detailsBox, { backgroundColor: colors.surfaceSubtle }]}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={14} color={colors.primary} />
            <Text style={[styles.detailText, { color: colors.text }]}>{workshop.date}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={14} color={colors.primary} />
            <Text style={[styles.detailText, { color: colors.text }]}>{workshop.time}</Text>
          </View>
        </View>

        <View style={styles.speakerRow}>
          <Image source={{ uri: workshop.speaker.avatar }} style={styles.speakerAvatar} />
          <View style={styles.speakerCol}>
            <Text style={[styles.speakerName, { color: colors.text }]}>
              {workshop.speaker.name}
            </Text>
            <Text style={[styles.speakerTitle, { color: colors.textMuted }]} numberOfLines={1}>
              {workshop.speaker.title}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
            <Text style={[styles.priceLabel, { color: colors.textMuted }]} numberOfLines={1}>
              {isBangla ? 'রেজিস্ট্রেশন ফি' : 'Registration'}
            </Text>
            <Text style={[styles.priceValue, { color: colors.primary }]} numberOfLines={1}>
              {isFree ? (isBangla ? 'বিনামূল্যে' : 'Free') : `৳ ${bdtPrice.toLocaleString()}`}
            </Text>
          </View>

          {workshop.isLive ? (
            <SpringPressable
              style={[styles.rsvpBtn, styles.joinLiveBtn]}
              onPress={handleJoinLive}
              activeScale={0.96}
              accessibilityRole="button"
              accessibilityLabel={`Join live broadcast for ${workshop.title}`}
            >
              <Ionicons name="radio" size={16} color="#FFFFFF" />
              <Text style={styles.joinLiveText}>
                {isBangla ? 'লাইভে যোগ দিন' : 'Join Live Class'}
              </Text>
            </SpringPressable>
          ) : (
            <SpringPressable
              style={[
                styles.rsvpBtn,
                {
                  backgroundColor: registered ? colors.primaryLight : colors.primary,
                },
              ]}
              onPress={handleToggleRsvp}
              activeScale={0.96}
              accessibilityRole="button"
              accessibilityState={{ selected: registered }}
              accessibilityLabel={registered ? `Cancel reservation for ${workshop.title}` : `Reserve seat for ${workshop.title}`}
            >
              <Ionicons
                name={registered ? 'checkmark-circle' : 'ticket-outline'}
                size={16}
                color={registered ? colors.primary : colors.onPrimary}
              />
              <Text
                style={[
                  styles.rsvpText,
                  { color: registered ? colors.primary : colors.onPrimary },
                ]}
                numberOfLines={1}
              >
                {registered
                  ? (isBangla ? 'বুকিং নিশ্চিত' : 'Seat Reserved')
                  : (isBangla ? 'সিট বুক করুন' : 'Reserve Seat')}
              </Text>
            </SpringPressable>
          )}
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 16 / 10,
    position: 'relative',
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  badgeRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    zIndex: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
    rowGap: 4,
  },
  liveBadge: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
    flexShrink: 1,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  seatsBadge: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    flexShrink: 0,
  },
  seatsText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  detailsBox: {
    padding: 10,
    borderRadius: 10,
    gap: 6,
    marginBottom: 14,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    fontWeight: '600',
  },
  speakerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  speakerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  speakerCol: {
    flex: 1,
    minWidth: 0,
  },
  speakerName: {
    fontSize: 13,
    fontWeight: '700',
  },
  speakerTitle: {
    fontSize: 11,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
    gap: 8,
  },
  priceLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  rsvpBtn: {
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    flexShrink: 0,
  },
  rsvpText: {
    fontSize: 13,
    fontWeight: '700',
  },
  joinLiveBtn: {
    backgroundColor: '#DC2626',
    elevation: 3,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  joinLiveText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  liveBadgeActive: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
  },
  pulseDotLive: {
    backgroundColor: '#FFFFFF',
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  viewersBadge: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    flexShrink: 0,
  },
});
