import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { triggerHaptic } from '../../utils/haptics';
import { lessonPlayerStyles as styles } from './lessonPlayerStyles';

interface LessonAccessBannersProps {
  isPrivileged: boolean;
  isAdmin: boolean;
  isEnrolled: boolean;
  isFreePreview: boolean;
  isFullscreen: boolean;
  isDark: boolean;
  isBangla: boolean;
  onUnlockTestCert: () => void;
  onOpenTestReview: () => void;
}

export const LessonAccessBanners: React.FC<LessonAccessBannersProps> = ({
  isPrivileged,
  isAdmin,
  isEnrolled,
  isFreePreview,
  isFullscreen,
  isDark,
  isBangla,
  onUnlockTestCert,
  onOpenTestReview,
}) => (
  <>
    {isPrivileged && !isFullscreen && (
      <View
        style={[
          styles.adminBanner,
          { backgroundColor: '#102F53', borderColor: 'rgba(227, 66, 52, 0.4)' },
        ]}
      >
        <View style={styles.adminBannerLeft}>
          <Ionicons name="shield-checkmark" size={14} color="#E34234" />
          <Text style={styles.adminBannerTitle}>
            {isAdmin ? 'ADMINISTRATOR ACCESS ACTIVE' : 'DEVELOPER ACCESS ACTIVE'}
          </Text>
        </View>
        <Text style={styles.adminBannerSub}>
          {isBangla
            ? 'মাস্টার বাইপাস সক্রিয়: কোর্সের সকল ভিডিও আনলক করা হয়েছে'
            : 'Master bypass: Unrestricted playback of all course videos'}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              backgroundColor: '#E34234',
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 6,
            }}
            onPress={() => {
              triggerHaptic('success');
              onUnlockTestCert();
            }}
            accessibilityRole="button"
            accessibilityLabel="Test Certificate Generation"
          >
            <Ionicons name="ribbon" size={12} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>
              {isBangla ? 'সার্টিফিকেট টেস্ট' : 'Test Certificate'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 6,
            }}
            onPress={() => {
              triggerHaptic('light');
              onOpenTestReview();
            }}
            accessibilityRole="button"
            accessibilityLabel="Test Mandatory Review Modal"
          >
            <Ionicons name="star" size={12} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>
              {isBangla ? 'রিভিউ মডাল টেস্ট' : 'Test Review'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    )}

    {!isPrivileged && !isEnrolled && isFreePreview && !isFullscreen && (
      <View
        style={[
          styles.previewBanner,
          {
            backgroundColor: isDark ? 'rgba(59, 130, 246, 0.16)' : '#EFF6FF',
            borderColor: '#3B82F6',
          },
        ]}
      >
        <Ionicons name="play-circle-outline" size={14} color={isDark ? '#93C5FD' : '#2563EB'} />
        <Text style={[styles.previewBannerText, { color: isDark ? '#93C5FD' : '#1D4ED8' }]}>
          {isBangla ? 'ফ্রি প্রিভিউ লেকচার চলছে' : 'Free Preview Lesson • Enroll for Full Access'}
        </Text>
      </View>
    )}
  </>
);
