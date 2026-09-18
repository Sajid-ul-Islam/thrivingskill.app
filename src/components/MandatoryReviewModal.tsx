import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface MandatoryReviewModalProps {
  visible: boolean;
  courseTitle: string;
  instructorName: string;
  onSubmit: (rating: number, feedback: string) => void;
  onDismissLater?: () => void;
}

export const MandatoryReviewModal: React.FC<MandatoryReviewModalProps> = ({
  visible,
  courseTitle,
  instructorName,
  onSubmit,
  onDismissLater,
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();

  const [rating, setRating] = useState<number>(5);
  const [feedback, setFeedback] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const getRatingLabel = (score: number) => {
    switch (score) {
      case 1:
        return isBangla ? '১ - সন্তোষজনক নয় / Poor' : '1 - Needs Improvement';
      case 2:
        return isBangla ? '২ - সাধারণ / Fair' : '2 - Fair';
      case 3:
        return isBangla ? '৩ - ভালো / Good' : '3 - Good';
      case 4:
        return isBangla ? '৪ - খুব ভালো / Very Good' : '4 - Very Good';
      case 5:
        return isBangla ? '৫ - অসাধারণ ও কার্যকরী / Excellent!' : '5 - Outstanding Masterclass!';
      default:
        return isBangla ? 'রেটিং নির্বাচন করুন' : 'Tap a star to rate';
    }
  };

  const handleSubmit = () => {
    if (rating === 0) {
      setErrorMessage(isBangla ? 'দয়া করে ১ থেকে ৫ এর মধ্যে স্টার রেটিং দিন।' : 'Please select a star rating (1-5).');
      return;
    }
    if (feedback.trim().length < 5) {
      setErrorMessage(
        isBangla
          ? 'দয়া করে কোর্সের উপর অন্তত ৫ অক্ষরের সংক্ষিপ্ত মতামত লিখুন।'
          : 'Please write at least a brief feedback (5+ characters).'
      );
      return;
    }
    setErrorMessage('');
    onSubmit(rating, feedback.trim());
  };

  const handleDismiss = () => {
    Alert.alert(
      isBangla ? 'সার্টিফিকেট লক থাকবে' : 'Certificate Remains Locked',
      isBangla
        ? 'আপনি পরবর্তীতে কোর্স পেজে এসে রিভিউ প্রদান করে সার্টিফিকেট আনলক করতে পারবেন।'
        : 'You can submit your review anytime from the Course page to unlock and download your certificate.',
      [
        { text: isBangla ? 'এখনই রিভিউ দিন' : 'Stay & Review', style: 'cancel' },
        {
          text: isBangla ? 'পরে করব' : 'Dismiss for now',
          style: 'destructive',
          onPress: () => {
            if (onDismissLater) onDismissLater();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleDismiss}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.modalCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header / Lock badge */}
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: '#F59E0B1A' }]}>
                <Ionicons name="ribbon" size={16} color="#F59E0B" />
                <Text style={styles.badgeText}>
                  {isBangla ? 'সার্টিফিকেট আনলক করতে রিভিউ আবশ্যক' : 'REVIEW REQUIRED FOR CERTIFICATE'}
                </Text>
              </View>
            </View>

            <View style={styles.trophyIconContainer}>
              <View style={styles.iconCircle}>
                <Ionicons name="trophy" size={36} color="#F59E0B" />
              </View>
              <View style={styles.lockBadge}>
                <Ionicons name="lock-closed" size={14} color="#FFFFFF" />
              </View>
            </View>

            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {isBangla ? 'অভিনন্দন! কোর্সটি সম্পন্ন করেছেন' : 'Course Completed!'}
            </Text>

            <Text style={[styles.courseName, { color: colors.primary }]} numberOfLines={2}>
              "{courseTitle}"
            </Text>

            <Text style={[styles.instructorText, { color: colors.textMuted }]}>
              {isBangla ? `প্রশিক্ষক: ${instructorName}` : `Instructor: ${instructorName}`}
            </Text>

            <Text style={[styles.instructionText, { color: colors.textMuted }]}>
              {isBangla
                ? 'আপনার অফিসিয়াল ভেরিফায়েড সার্টিফিকেট আনলক করতে কোর্সটির উপর ১ থেকে ৫ স্টার দিন এবং আপনার মূল্যবান রিভিউ লিখুন।'
                : 'To unlock and download your verified course certificate, please rate your experience from 1 to 5 stars and leave your authentic feedback.'}
            </Text>

            {/* Star Rating Section */}
            <View style={[styles.ratingBox, { backgroundColor: isDark ? '#1F2937' : '#F9FAFB' }]}>
              <Text style={[styles.ratingPrompt, { color: colors.text }]}>
                {isBangla ? 'স্টার রেটিং দিন (১ - ৫):' : 'Select Star Rating (1 - 5):'}
              </Text>

              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    activeOpacity={0.7}
                    onPress={() => {
                      setRating(star);
                      setErrorMessage('');
                    }}
                    style={styles.starTouchArea}
                    accessibilityLabel={`Rate ${star} star`}
                  >
                    <Ionicons
                      name={rating >= star ? 'star' : 'star-outline'}
                      size={36}
                      color="#F59E0B"
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.ratingScoreLabel}>{getRatingLabel(rating)}</Text>
            </View>

            {/* Feedback Text Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {isBangla ? 'আপনার মতামত / রিভিউ লিখুন:' : 'Your Course Review:'}
              </Text>
              <TextInput
                style={[
                  styles.feedbackInput,
                  {
                    backgroundColor: isDark ? '#111827' : '#FFFFFF',
                    color: colors.text,
                    borderColor: errorMessage ? '#EF4444' : colors.border,
                  },
                ]}
                placeholder={
                  isBangla
                    ? 'কোর্সের কোন বিষয়টি আপনার সবচেয়ে ভালো লেগেছে? আপনার ক্যারিয়ারে কীভাবে কাজে লাগবে...'
                    : 'What did you find most useful? Share your thoughts for the instructor and fellow learners...'
                }
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={feedback}
                onChangeText={(text) => {
                  setFeedback(text);
                  if (errorMessage) setErrorMessage('');
                }}
              />
              <View style={styles.charCountRow}>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>
                  {feedback.trim().length} {isBangla ? 'অক্ষর' : 'chars'}
                </Text>
              </View>
            </View>

            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Submit Action Button */}
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleSubmit}
              activeOpacity={0.85}
            >
              <Ionicons name="lock-open" size={18} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>
                {isBangla ? 'রিভিউ জমা দিন ও সার্টিফিকেট আনলক করুন' : 'Submit Review & Unlock Certificate'}
              </Text>
            </TouchableOpacity>

            {/* Dismiss for now */}
            {onDismissLater && (
              <TouchableOpacity style={styles.laterButton} onPress={handleDismiss}>
                <Text style={[styles.laterButtonText, { color: colors.textMuted }]}>
                  {isBangla ? 'পরে রিভিউ দেব (সার্টিফিকেট লক থাকবে)' : 'I will review later (Keep certificate locked)'}
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: '92%',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  badgeRow: {
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.5,
  },
  trophyIconContainer: {
    position: 'relative',
    marginVertical: 6,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 10,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
  instructorText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  ratingBox: {
    width: '100%',
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingPrompt: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  starTouchArea: {
    padding: 4,
  },
  ratingScoreLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D97706',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  feedbackInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 88,
  },
  charCountRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  laterButton: {
    paddingVertical: 12,
    marginTop: 4,
  },
  laterButtonText: {
    fontSize: 13,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});
