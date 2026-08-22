import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Workshop } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useLearning } from '../context/LearningContext';

interface LiveWorkshopCardProps {
  workshop: Workshop;
  onPress: () => void;
}

export const LiveWorkshopCard: React.FC<LiveWorkshopCardProps> = ({ workshop, onPress }) => {
  const { colors } = useTheme();
  const { isRsvpd, rsvpForWorkshop } = useLearning();
  const registered = isRsvpd(workshop.id);

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
        <Image source={{ uri: workshop.thumbnail }} style={styles.thumbnail} />
        <View style={styles.liveBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.liveText}>UPCOMING WORKSHOP</Text>
        </View>

        <View style={styles.seatsBadge}>
          <Ionicons name="people" size={12} color="#FFFFFF" />
          <Text style={styles.seatsText}>{workshop.seatsLeft} seats left</Text>
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
          <View>
            <Text style={[styles.priceLabel, { color: colors.textMuted }]}>Registration</Text>
            <Text style={[styles.priceValue, { color: colors.primary }]}>
              ${workshop.price.toFixed(2)}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.rsvpBtn,
              {
                backgroundColor: registered ? colors.primaryLight : colors.primary,
              },
            ]}
            onPress={() => rsvpForWorkshop(workshop.id)}
            disabled={registered}
            activeOpacity={0.8}
          >
            <Ionicons
              name={registered ? 'checkmark-circle' : 'ticket-outline'}
              size={16}
              color={registered ? colors.primary : '#FFFFFF'}
            />
            <Text
              style={[
                styles.rsvpText,
                { color: registered ? colors.primary : '#FFFFFF' },
              ]}
            >
              {registered ? 'Seat Reserved' : 'Reserve Seat'}
            </Text>
          </TouchableOpacity>
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
    height: 150,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  liveBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
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
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  seatsText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
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
  },
  priceLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  rsvpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  rsvpText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
