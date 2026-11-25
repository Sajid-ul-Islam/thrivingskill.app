import React from 'react';
import {
  PaymentModal,
  MandatoryReviewModal,
  CourseCertificatePreviewModal,
  CourseWriteReviewModal,
} from '../../components';
import { Course } from '../../types';

interface CourseDetailModalsProps {
  course: Course;
  userName: string;
  isPrivileged: boolean;
  isCompleted: boolean;
  isUnlocked: boolean;
  hasReviewed: boolean;
  certificateId?: string;
  mandatoryReviewVisible: boolean;
  paymentModalVisible: boolean;
  certPreviewVisible: boolean;
  writeReviewModalVisible: boolean;
  reviewRating: number;
  reviewComment: string;
  isSubmittingReview: boolean;
  onCloseMandatoryReview: () => void;
  onOpenMandatoryReview: () => void;
  onSubmitMandatoryReview: (rating: number, feedback: string) => void;
  onClosePayment: () => void;
  onPaymentSuccess: () => void;
  onCloseCertPreview: () => void;
  onChangeRating: (rating: number) => void;
  onChangeComment: (comment: string) => void;
  onSubmitReview: () => void;
  onCloseWriteReview: () => void;
}

export const CourseDetailModals: React.FC<CourseDetailModalsProps> = ({
  course,
  userName,
  isPrivileged,
  isCompleted,
  isUnlocked,
  hasReviewed,
  certificateId,
  mandatoryReviewVisible,
  paymentModalVisible,
  certPreviewVisible,
  writeReviewModalVisible,
  reviewRating,
  reviewComment,
  isSubmittingReview,
  onCloseMandatoryReview,
  onOpenMandatoryReview,
  onSubmitMandatoryReview,
  onClosePayment,
  onPaymentSuccess,
  onCloseCertPreview,
  onChangeRating,
  onChangeComment,
  onSubmitReview,
  onCloseWriteReview,
}) => (
  <>
    <MandatoryReviewModal
      visible={mandatoryReviewVisible}
      courseTitle={course.title}
      instructorName={course.instructor.name}
      onSubmit={onSubmitMandatoryReview}
      onDismissLater={onCloseMandatoryReview}
    />

    <PaymentModal
      visible={paymentModalVisible}
      course={course}
      onClose={onClosePayment}
      onSuccess={onPaymentSuccess}
    />

    <CourseCertificatePreviewModal
      visible={certPreviewVisible}
      course={course}
      userName={userName}
      isUnlocked={isUnlocked}
      isCompleted={isCompleted}
      hasReviewed={hasReviewed}
      certificateId={certificateId}
      onClose={onCloseCertPreview}
      onOpenMandatoryReview={onOpenMandatoryReview}
    />

    <CourseWriteReviewModal
      visible={writeReviewModalVisible}
      courseTitle={course.title}
      rating={reviewRating}
      comment={reviewComment}
      isSubmitting={isSubmittingReview}
      onChangeRating={onChangeRating}
      onChangeComment={onChangeComment}
      onSubmit={onSubmitReview}
      onClose={onCloseWriteReview}
    />
  </>
);
