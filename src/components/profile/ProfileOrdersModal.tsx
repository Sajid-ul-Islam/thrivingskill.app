import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '../../theme/responsive';
import { Course, UserProgress } from '../../types';

interface ProfileOrdersModalProps {
  visible: boolean;
  onClose: () => void;
  colors: any;
  isBangla: boolean;
  enrolledOrderCourses: Course[];
  userProgress: Record<string, UserProgress>;
  insetsBottom: number;
}

export const ProfileOrdersModal: React.FC<ProfileOrdersModalProps> = ({
  visible,
  onClose,
  colors,
  isBangla,
  enrolledOrderCourses,
  userProgress,
  insetsBottom,
}) => {
  const insets = useSafeAreaInsets();
  const effectiveBottom = Math.max(insets.bottom, insetsBottom || 0);
  const { isTablet } = useResponsive();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.modalBackdrop,
          isTablet && styles.modalBackdropTablet,
          {
            paddingTop: Math.max(16, insets.top),
            paddingBottom: Math.max(16, effectiveBottom),
          },
        ]}
      >
        <View
          style={[
            styles.modalCard,
            isTablet && styles.modalCardTablet,
            { backgroundColor: colors.surfaceCard, borderColor: colors.border, maxHeight: '85%' },
          ]}
        >
          <View style={styles.modalHeader}>
            <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {isBangla ? 'অর্ডার ও কোর্স রেকর্ড' : 'Orders & Course Records'}
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                {isBangla
                  ? 'আপনার অ্যাকাউন্টের সিঙ্ক করা LearnPress ও WooCommerce অর্ডার'
                  : 'LearnPress & WooCommerce orders synced with your account'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.modalCloseBtn}
              accessibilityRole="button"
              accessibilityLabel={isBangla ? 'অর্ডার রেকর্ড উইন্ডো বন্ধ করুন' : 'Close orders modal'}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingVertical: 8,
              gap: 12,
              paddingBottom: Math.max(insetsBottom, 16),
            }}
          >
            {enrolledOrderCourses.length === 0 ? (
              <View
                style={[
                  styles.invoiceItemCard,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.borderSubtle,
                    alignItems: 'center',
                    paddingVertical: 20,
                  },
                ]}
              >
                <Ionicons name="library-outline" size={28} color={colors.textMuted} />
                <Text style={[styles.invoiceItemTitle, { color: colors.text, textAlign: 'center' }]}>
                  {isBangla ? 'কোনো সক্রিয় কোর্স এনরোলমেন্ট পাওয়া যায়নি' : 'No Active Course Records Yet'}
                </Text>
                <Text style={[styles.invoiceGateway, { color: colors.textMuted, textAlign: 'center' }]}>
                  {isBangla
                    ? 'আপনার থ্রাইভিং স্কিলস অ্যাকাউন্টে সাইন ইন করলে আপনার এনরোল করা কোর্সগুলো এখানে প্রদর্শিত হবে।'
                    : 'Sign in with your Thriving Skills account to view courses synced to your member library.'}
                </Text>
              </View>
            ) : (
              enrolledOrderCourses.map((courseItem) => {
                const prog = userProgress[courseItem.id];
                const isFree = !courseItem.price || courseItem.price === 0;
                return (
                  <View
                    key={courseItem.id}
                    style={[
                      styles.invoiceItemCard,
                      { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle },
                    ]}
                  >
                    <View style={styles.invoiceItemTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.invoiceItemTitle, { color: colors.text }]} numberOfLines={2}>
                          {courseItem.title}
                        </Text>
                        <Text style={[styles.invoiceMeta, { color: colors.textMuted }]}>
                          {courseItem.instructor?.name || 'Thriving Skills'} •{' '}
                          {prog?.isCompleted ? 'Completed' : 'In Progress'}
                        </Text>
                      </View>
                      <View style={styles.invoiceStatusBadge}>
                        <Text style={styles.invoiceStatusText}>{isFree ? 'FREE' : 'ENROLLED'}</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalBackdropTablet: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
    maxHeight: '85%',
  },
  modalCardTablet: {
    maxWidth: 600,
    width: '90%',
    alignSelf: 'center',
    borderRadius: 24,
    borderBottomWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  modalCloseBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  invoiceItemCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  invoiceItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  invoiceItemTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  invoiceMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  invoiceStatusBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 0,
  },
  invoiceStatusText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
  },
  invoiceGateway: {
    fontSize: 11,
    marginTop: 1,
  },
});
