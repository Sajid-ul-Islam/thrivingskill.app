import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { triggerHaptic } from '../../utils/haptics';

interface CourseWriteReviewModalProps {
  visible: boolean;
  courseTitle: string;
  rating: number;
  comment: string;
  isSubmitting: boolean;
  onChangeRating: (rating: number) => void;
  onChangeComment: (comment: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export const CourseWriteReviewModal: React.FC<CourseWriteReviewModalProps> = ({
  visible,
  courseTitle,
  rating,
  comment,
  isSubmitting,
  onChangeRating,
  onChangeComment,
  onSubmit,
  onClose,
}) => {
  const { colors } = useTheme();
  const { isBangla } = useLanguage();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[
          styles.reviewModalOverlay,
          {
            paddingTop: Math.max(16, insets.top),
            paddingBottom: Math.max(16, insets.bottom),
          },
        ]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={[styles.reviewModalCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
          <View style={styles.reviewModalHeader}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="star" size={20} color="#F59E0B" style={{ flexShrink: 0 }} />
              <Text style={[styles.reviewModalTitle, { color: colors.text }]} numberOfLines={1}>
                {isBangla ? 'কোর্স রেটিং ও রিভিউ' : 'Rate & Review Course'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ flexShrink: 0 }}
              accessibilityRole="button"
              accessibilityLabel="Close review dialog"
            >
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <Text style={[styles.reviewCourseTitle, { color: colors.text }]}>
              {courseTitle}
            </Text>
            <Text style={[styles.reviewModalSub, { color: colors.textMuted }]}>
              {isBangla
                ? 'আপনার অভিজ্ঞতার ওপর ভিত্তি করে রেটিং এবং মূল্যবান মতামত শেয়ার করুন।'
                : 'Select your rating score and write your genuine learning experience.'}
            </Text>

            {/* Star Rating Selector */}
            <View style={styles.starsSelectorRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => {
                    triggerHaptic('selection');
                    onChangeRating(star);
                  }}
                  style={styles.starTouch}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={isBangla ? `${star} তারকা রেটিং` : `${star} stars rating`}
                  accessibilityState={{ selected: star <= rating }}
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                >
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={32}
                    color="#F59E0B"
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.ratingFeedbackLabel, { color: colors.primary }]}>
              {rating === 5
                ? '★★★★★ Outstanding / 5.0'
                : rating === 4
                ? '★★★★ Very Good / 4.0'
                : rating === 3
                ? '★★★ Good / 3.0'
                : rating === 2
                ? '★★ Fair / 2.0'
                : '★ Needs Improvement / 1.0'}
            </Text>

            {/* Comment Input */}
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              {isBangla ? 'আপনার রিভিউ লিখুন' : 'Your Detailed Feedback'}
            </Text>
            <TextInput
              style={[
                styles.reviewTextInput,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder={
                isBangla
                  ? 'কোর্স কনটেন্ট, ইন্সট্রাক্টরের দক্ষতা ও আপনার অর্জিত অভিজ্ঞতা সম্পর্কে লিখুন...'
                  : 'Share how this masterclass improved your executive skillset and workplace productivity...'
              }
              placeholderTextColor={colors.textMuted}
              value={comment}
              onChangeText={onChangeComment}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              accessibilityLabel={isBangla ? 'আপনার রিভিউ মতামত' : 'Your Detailed Feedback'}
            />

            {/* Actions */}
            <View style={styles.reviewModalActions}>
              <TouchableOpacity
                style={[styles.submitReviewBtn, { backgroundColor: colors.primary }]}
                onPress={onSubmit}
                disabled={isSubmitting}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel={isBangla ? 'রিভিউ সাবমিট করুন' : 'Submit Review'}
              >
                <Ionicons name="checkmark-circle" size={18} color={colors.onPrimary} />
                <Text style={[styles.submitReviewBtnText, { color: colors.onPrimary }]}>
                  {isBangla ? 'রিভিউ সাবমিট করুন' : 'Submit Review'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cancelReviewBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={isBangla ? 'বাতিল' : 'Cancel'}
              >
                <Text style={[styles.cancelReviewBtnText, { color: colors.textMuted }]}>
                  {isBangla ? 'বাতিল' : 'Cancel'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  reviewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  reviewModalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    padding: 20,
    maxHeight: '90%',
  },
  reviewModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  reviewModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
  },
  reviewCourseTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  reviewModalSub: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 16,
  },
  starsSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  starTouch: {
    padding: 4,
  },
  ratingFeedbackLabel: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  reviewTextInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    minHeight: 100,
    marginBottom: 16,
  },
  reviewModalActions: {
    gap: 8,
  },
  submitReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 10,
  },
  submitReviewBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  cancelReviewBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
  },
  cancelReviewBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
