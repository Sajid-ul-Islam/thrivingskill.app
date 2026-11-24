import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Platform,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { PartnerLogoItem } from '../../services/api/brandingService';
import { typography } from '../../theme/typography';
import { shape } from '../../theme/shapes';
import { getSafeImageSource } from '../../utils/imageUtils';

interface PartnerLogoMarqueeProps {
  logos: PartnerLogoItem[];
}

const ITEM_WIDTH = 130;
const ITEM_GAP = 12;
const SNAP_INTERVAL = ITEM_WIDTH + ITEM_GAP;

export const PartnerLogoMarquee: React.FC<PartnerLogoMarqueeProps> = ({ logos }) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();
  const flatRef = useRef<FlatList<PartnerLogoItem> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollOffsetRef = useRef<number>(0);
  const isInteractingRef = useRef<boolean>(false);

  // Duplicate list to give seamless infinite continuous scroll illusion
  const marqueeItems = React.useMemo(() => {
    if (!logos || logos.length === 0) return [];
    return [...logos, ...logos, ...logos];
  }, [logos]);

  const totalContentWidth = marqueeItems.length * SNAP_INTERVAL;

  useEffect(() => {
    if (marqueeItems.length === 0) return;

    timerRef.current = setInterval(() => {
      if (isInteractingRef.current) return;
      scrollOffsetRef.current += SNAP_INTERVAL;

      // If scrolled past 2/3 of content, loop back smoothly
      if (scrollOffsetRef.current >= totalContentWidth * (2 / 3)) {
        scrollOffsetRef.current = 0;
        flatRef.current?.scrollToOffset({ offset: 0, animated: false });
      } else {
        flatRef.current?.scrollToOffset({
          offset: scrollOffsetRef.current,
          animated: true,
        });
      }
    }, 2800);

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [marqueeItems.length, totalContentWidth]);

  if (!logos || logos.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={[styles.badgePill, { backgroundColor: isDark ? 'rgba(255, 182, 6, 0.15)' : '#FEF3C7' }]}>
          <Text style={[styles.badgeText, { color: isDark ? '#FBBF24' : '#B45309' }]}>
            {isBangla ? 'কর্পোরেট পার্টনারশিপ' : 'ENTERPRISE TRUST'}
          </Text>
        </View>
        <Text style={[typography.caption, styles.title, { color: colors.textMuted }]}>
          {isBangla
            ? 'শীর্ষস্থানীয় কোম্পানি ও প্রতিষ্ঠানের আস্থা'
            : 'Trusted by Top Leading Companies & Institutions'}
        </Text>
      </View>

      <FlatList
        ref={flatRef}
        data={marqueeItems}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onScrollBeginDrag={() => {
          isInteractingRef.current = true;
        }}
        onScrollEndDrag={() => {
          isInteractingRef.current = false;
        }}
        onMomentumScrollEnd={(e) => {
          scrollOffsetRef.current = e.nativeEvent.contentOffset.x;
          isInteractingRef.current = false;
        }}
        getItemLayout={(_, index) => ({
          length: SNAP_INTERVAL,
          offset: SNAP_INTERVAL * index,
          index,
        })}
        renderItem={({ item }) => (
          <View
            style={[
              styles.logoCard,
              {
                backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
                borderColor: colors.border,
              },
            ]}
          >
            <Image
              source={getSafeImageSource(item.logoUrl)}
              style={styles.logoImage}
              resizeMode="contain"
              {...(Platform.OS === 'web' ? { referrerPolicy: 'no-referrer' } : {})}
            />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  headerRow: {
    paddingHorizontal: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: shape.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  title: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: ITEM_GAP,
    alignItems: 'center',
  },
  logoCard: {
    width: ITEM_WIDTH,
    height: 52,
    borderRadius: shape.medium,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#102F53',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 3px rgba(16, 47, 83, 0.05)',
      },
    }),
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
});
