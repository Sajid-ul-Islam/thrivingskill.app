import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Course } from '../../../types';
import { paymentModalStyles as styles } from './paymentModal.styles';

interface MemberSyncViewProps {
  course: Course;
  colors: any;
  isDark: boolean;
  isBangla: boolean;
  isAuthenticated: boolean;
  user: any;
  isSyncing: boolean;
  syncingLabel: string;
  onSync: () => void;
}

export const MemberSyncView: React.FC<MemberSyncViewProps> = ({
  course,
  colors,
  isDark,
  isBangla,
  isAuthenticated,
  user,
  isSyncing,
  syncingLabel,
  onSync,
}) => (
  <>
    <View
      style={[
        styles.courseSummaryCard,
        { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.courseTitle, { color: colors.text }]} numberOfLines={2}>
        {course.title}
      </Text>
      <Text style={[styles.instructorName, { color: colors.textMuted }]}>
        Mentor: {course.instructor.name}
      </Text>
      <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
      <View style={styles.accessBadgeRow}>
        <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
        <Text style={[styles.accessStatusText, { color: colors.primary }]}>
          {isBangla ? 'সক্রিয় সদস্যদের জন্য সংরক্ষিত কোর্স' : 'Available to Enrolled Members'}
        </Text>
      </View>
    </View>

    <View
      style={[
        styles.noticeBox,
        {
          backgroundColor: colors.primaryLight,
          borderColor: isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(16, 47, 83, 0.18)',
        },
      ]}
    >
      <View style={styles.noticeHeader}>
        <Ionicons name="information-circle" size={20} color={colors.primary} />
        <Text style={[styles.noticeTitle, { color: colors.primary }]}>
          {isBangla ? 'কম্প্যানিয়ন লার্নিং অ্যাক্সেস' : 'Cross-Platform Account Access'}
        </Text>
      </View>
      <Text style={[styles.noticeBody, { color: colors.text }]}>
        {isAuthenticated
          ? isBangla
            ? `আপনি বর্তমানে ${user?.email || user?.username} অ্যাকাউন্টে সাইন ইন আছেন। আপনার অ্যাকাউন্টে এই কোর্সের এনরোলমেন্ট থাকলে নিচের বাটনে ট্যাপ করে সিঙ্ক করুন।`
            : `Signed in as ${user?.email || user?.username}. If your account is enrolled in this course, tap below to sync your latest LearnPress access.`
          : isBangla
            ? 'আপনার এনরোল করা কোর্সগুলো আনলক করতে অনুগ্রহ করে আপনার থ্রাইভিং স্কিলস অ্যাকাউন্ট দিয়ে সাইন ইন করুন।'
            : 'Sign in with your Thriving Skills account to access courses in your enrolled member library.'}
      </Text>
    </View>

    <TouchableOpacity
      style={[styles.primaryCheckoutBtn, { backgroundColor: colors.primary }]}
      onPress={onSync}
      disabled={isSyncing}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={
        isAuthenticated
          ? isBangla
            ? 'অ্যাকাউন্ট এনরোলমেন্ট সিঙ্ক করুন'
            : 'Sync Account Enrollments'
          : isBangla
            ? 'থ্রাইভিং স্কিলস অ্যাকাউন্টে সাইন ইন'
            : 'Sign In to Sync Account'
      }
    >
      {isSyncing ? (
        <>
          <ActivityIndicator color={colors.onPrimary} size="small" style={{ marginRight: 8 }} />
          <Text style={[styles.primaryBtnText, { color: colors.onPrimary }]}>{syncingLabel}</Text>
        </>
      ) : (
        <>
          <Ionicons
            name={isAuthenticated ? 'sync' : 'log-in-outline'}
            size={20}
            color={colors.onPrimary}
            style={{ marginRight: 8 }}
          />
          <Text style={[styles.primaryBtnText, { color: colors.onPrimary }]}>
            {isAuthenticated
              ? isBangla
                ? 'অ্যাকাউন্ট এনরোলমেন্ট সিঙ্ক করুন'
                : 'Sync Account Enrollments'
              : isBangla
                ? 'থ্রাইভিং স্কিলস অ্যাকাউন্টে সাইন ইন'
                : 'Sign In to Sync Account'}
          </Text>
        </>
      )}
    </TouchableOpacity>
  </>
);
