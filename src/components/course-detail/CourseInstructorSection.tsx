import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Instructor } from '../../types';
import { getInstructorAvatarSource } from '../../utils/imageUtils';

interface CourseInstructorSectionProps {
  instructor: Instructor;
}

export const CourseInstructorSection: React.FC<CourseInstructorSectionProps> = ({
  instructor,
}) => {
  const { colors } = useTheme();
  const { isBangla } = useLanguage();
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    setAvatarError(false);
  }, [instructor.avatar, instructor.name]);

  const avatarSource = getInstructorAvatarSource(instructor.name, instructor.avatar);

  return (
    <View
      style={[
        styles.instructorCard,
        { backgroundColor: colors.surfaceCard, borderColor: colors.border },
      ]}
    >
      <View style={styles.instructorHeader}>
        {!avatarError ? (
          <Image
            source={avatarSource}
            style={[styles.instructorAvatar, { borderColor: colors.border }]}
            onError={() => setAvatarError(true)}
            {...(Platform.OS === 'web' ? { referrerPolicy: 'no-referrer' } : {})}
          />
        ) : (
          <View
            style={[
              styles.instructorAvatar,
              styles.avatarInitialsCircle,
              { backgroundColor: colors.primary },
            ]}
          >
            <Text style={styles.avatarInitialsText}>
              {(instructor.name || 'I').charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.instructorMeta}>
          <View style={styles.instructorNameRow}>
            <Text style={[styles.instructorName, { color: colors.text }]}>
              {instructor.name}
            </Text>
            <Ionicons name="checkmark-circle" size={15} color="#10B981" style={{ marginLeft: 4 }} />
          </View>
          <Text style={[styles.instructorTitle, { color: colors.primary }]}>
            {instructor.title}
          </Text>
          <Text style={[styles.instructorCompany, { color: colors.textMuted }]}>
            {instructor.company}
          </Text>
        </View>
      </View>

      <Text style={[styles.instructorBio, { color: colors.text }]}>
        {instructor.bio}
      </Text>

      <View style={[styles.instructorStats, { backgroundColor: colors.surfaceSubtle }]}>
        <View style={styles.instStatItem}>
          <Text style={[styles.instStatVal, { color: colors.text }]}>
            {instructor.rating}
          </Text>
          <Text style={[styles.instStatLbl, { color: colors.textMuted }]}>
            {isBangla ? 'রেটিং' : 'Rating'}
          </Text>
        </View>
        <View style={styles.instStatItem}>
          <Text style={[styles.instStatVal, { color: colors.text }]}>
            {instructor.studentsCount.toLocaleString()}
          </Text>
          <Text style={[styles.instStatLbl, { color: colors.textMuted }]}>
            {isBangla ? 'শিক্ষার্থী' : 'Students'}
          </Text>
        </View>
        <View style={styles.instStatItem}>
          <Text style={[styles.instStatVal, { color: colors.text }]}>
            {instructor.coursesCount}
          </Text>
          <Text style={[styles.instStatLbl, { color: colors.textMuted }]}>
            {isBangla ? 'কোর্স' : 'Courses'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  instructorCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  instructorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  instructorAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarInitialsCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialsText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  instructorMeta: {
    flex: 1,
  },
  instructorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  instructorName: {
    fontSize: 15,
    fontWeight: '700',
  },
  instructorTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  instructorCompany: {
    fontSize: 12,
  },
  instructorBio: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  instructorStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderRadius: 8,
  },
  instStatItem: {
    alignItems: 'center',
  },
  instStatVal: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  instStatLbl: {
    fontSize: 11,
  },
});
