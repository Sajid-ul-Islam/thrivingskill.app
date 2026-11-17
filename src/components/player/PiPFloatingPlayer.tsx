import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { triggerHaptic } from '../../utils/haptics';
import { MIN_TOUCH_TARGET } from '../../theme/typography';
import { shape } from '../../theme/shapes';

interface PiPFloatingPlayerProps {
  visible: boolean;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onMaximize: () => void;
  onClose: () => void;
  title: string;
  currentTimeFormatted: string;
}

export const PiPFloatingPlayer: React.FC<PiPFloatingPlayerProps> = ({
  visible,
  isPlaying,
  onTogglePlay,
  onMaximize,
  onClose,
  title,
  currentTimeFormatted,
}) => {
  if (!visible) return null;

  return (
    <View style={styles.floatingContainer} pointerEvents="box-none">
      <View style={styles.card}>
        {/* Top Header Row of PiP Card */}
        <View style={styles.headerRow}>
          <View style={styles.badgeRow}>
            <View style={styles.pipDot} />
            <Text style={styles.pipBadgeText}>PiP Active</Text>
          </View>
          <View style={styles.windowControls}>
            <TouchableOpacity
              style={styles.controlIconBtn}
              onPress={() => {
                triggerHaptic('light');
                onMaximize();
              }}
              accessibilityRole="button"
              accessibilityLabel="Maximize player"
            >
              <Ionicons name="expand" size={15} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlIconBtn}
              onPress={() => {
                triggerHaptic('light');
                onClose();
              }}
              accessibilityRole="button"
              accessibilityLabel="Close PiP player"
            >
              <Ionicons name="close" size={15} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Video simulation preview box */}
        <TouchableOpacity
          style={styles.previewBox}
          activeOpacity={0.9}
          onPress={onMaximize}
          accessibilityRole="button"
          accessibilityLabel={`Maximize player for ${title}`}
        >
          <Ionicons name="tv-outline" size={24} color="#FFB606" />
          <Text style={styles.previewTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.previewTime}>{currentTimeFormatted}</Text>

          <TouchableOpacity
            style={styles.playPausePill}
            onPress={(e) => {
              e.stopPropagation();
              triggerHaptic('light');
              onTogglePlay();
            }}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? "Pause video" : "Play video"}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={14}
              color="#102F53"
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: 90,
    right: 16,
    zIndex: 9999,
    width: 180,
  },
  card: {
    backgroundColor: '#102F53',
    borderRadius: shape.medium,
    padding: 8,
    borderWidth: 1.5,
    borderColor: '#FFB606',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  pipBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFB606',
    textTransform: 'uppercase',
  },
  windowControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  controlIconBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBox: {
    height: 90,
    backgroundColor: '#0A1E35',
    borderRadius: shape.small,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  previewTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
    textAlign: 'center',
  },
  previewTime: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  playPausePill: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFB606',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
