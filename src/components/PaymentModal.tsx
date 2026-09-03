import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Course } from '../types';

export type PaymentMethod = 'bkash' | 'nagad' | 'rocket' | 'sslcommerz';

interface PaymentModalProps {
  visible: boolean;
  course: Course | null;
  onClose: () => void;
  onSuccess: (courseId: string) => void;
}

const VALID_COUPONS: Record<string, { type: 'percent' | 'flat'; value: number }> = {
  TS50: { type: 'percent', value: 50 },
  EID2026: { type: 'flat', value: 300 },
  SKILLPRO: { type: 'flat', value: 200 },
  FREEPASS: { type: 'percent', value: 100 },
};

export const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  course,
  onClose,
  onSuccess,
}) => {
  const { colors, isDark } = useTheme();
  const { t, isBangla } = useLanguage();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('bkash');
  const [walletNumber, setWalletNumber] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!course) return null;

  const originalPriceBdt = course.priceBdt || Math.round(course.price * 118) || 500;
  const payableAmount = Math.max(0, originalPriceBdt - discountAmount);

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    if (VALID_COUPONS[code]) {
      const rule = VALID_COUPONS[code];
      let discount = 0;
      if (rule.type === 'percent') {
        discount = Math.round((originalPriceBdt * rule.value) / 100);
      } else {
        discount = Math.min(originalPriceBdt, rule.value);
      }
      setDiscountAmount(discount);
      setAppliedCoupon(code);
      Alert.alert('Coupon Applied! 🎁', `Code ${code} applied successfully! You saved ৳${discount}.`);
    } else {
      Alert.alert('Invalid Code', 'The coupon code entered is expired or invalid.');
    }
  };

  const handlePay = async () => {
    if ((selectedMethod === 'bkash' || selectedMethod === 'nagad' || selectedMethod === 'rocket') && !walletNumber.trim()) {
      Alert.alert('Wallet Number Required', 'Please enter your mobile wallet number to proceed.');
      return;
    }

    setIsProcessing(true);

    // Simulate merchant gateway handshake
    setTimeout(() => {
      setIsProcessing(false);
      const trxId = `TRX-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

      Alert.alert(
        t('paymentSuccessTitle'),
        `${t('paymentSuccessMsg')}\n\nTransaction ID: ${trxId}\nPaid Amount: ৳${payableAmount.toLocaleString()} BDT`,
        [
          {
            text: isBangla ? 'শেখা শুরু করুন' : 'Start Learning',
            onPress: () => {
              onSuccess(course.id);
              onClose();
            },
          },
        ]
      );
    }, 1500);
  };

  const paymentOptions: { id: PaymentMethod; name: string; icon: string; color: string; bg: string }[] = [
    { id: 'bkash', name: 'bKash (বিকাশ)', icon: 'phone-portrait', color: '#D12053', bg: '#FDF2F4' },
    { id: 'nagad', name: 'Nagad (নগদ)', icon: 'wallet', color: '#F7941D', bg: '#FEF6ED' },
    { id: 'rocket', name: 'DBBL Rocket', icon: 'flash', color: '#8C3494', bg: '#F9F2FA' },
    { id: 'sslcommerz', name: 'Cards / NetBanking', icon: 'card', color: '#059669', bg: '#ECFDF5' },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <TouchableOpacity style={styles.overlayClose} activeOpacity={1} onPress={onClose} />
        <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: isDark ? '#27272A' : '#F4F4F5' }]}
            onPress={onClose}
          >
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View style={[styles.lockBadge, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="shield-checkmark" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.text }]}>{t('checkoutTitle')}</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>{course.title}</Text>
              </View>
            </View>

            {/* Payment Method Selector */}
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>{t('selectPaymentMethod')}</Text>
            <View style={styles.methodsGrid}>
              {paymentOptions.map((opt) => {
                const isSelected = selectedMethod === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.methodCard,
                      {
                        backgroundColor: isSelected ? (isDark ? '#1F2937' : opt.bg) : colors.surfaceSubtle,
                        borderColor: isSelected ? opt.color : colors.border,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                    onPress={() => setSelectedMethod(opt.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={opt.icon as any} size={20} color={opt.color} />
                    <Text
                      style={[
                        styles.methodName,
                        { color: colors.text, fontWeight: isSelected ? '700' : '500' },
                      ]}
                      numberOfLines={1}
                    >
                      {opt.name}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={16} color={opt.color} style={styles.checkIcon} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Mobile Number Input for MFS */}
            {selectedMethod !== 'sslcommerz' && (
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>{t('walletNumber')}</Text>
                <View style={[styles.inputBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
                  <Ionicons name="call-outline" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
                  <TextInput
                    style={[styles.textInput, { color: colors.text }]}
                    placeholder={t('enterWalletNumber')}
                    placeholderTextColor={colors.textMuted + '80'}
                    keyboardType="phone-pad"
                    value={walletNumber}
                    onChangeText={setWalletNumber}
                  />
                </View>
              </View>
            )}

            {/* Promo Code Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>{t('couponCode')}</Text>
              <View style={styles.couponRow}>
                <View
                  style={[
                    styles.inputBox,
                    { flex: 1, backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                  ]}
                >
                  <Ionicons name="pricetag-outline" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
                  <TextInput
                    style={[styles.textInput, { color: colors.text }]}
                    placeholder="e.g. TS50 or EID2026"
                    placeholderTextColor={colors.textMuted + '80'}
                    autoCapitalize="characters"
                    value={couponInput}
                    onChangeText={setCouponInput}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.applyBtn, { backgroundColor: colors.primary }]}
                  onPress={handleApplyCoupon}
                >
                  <Text style={styles.applyBtnText}>{t('applyCoupon')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Bill Summary Card */}
            <View style={[styles.summaryCard, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>{t('subtotal')}</Text>
                <Text style={[styles.summaryVal, { color: colors.text }]}>৳{originalPriceBdt.toLocaleString()} BDT</Text>
              </View>
              {discountAmount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.primary }]}>
                    {t('discount')} ({appliedCoupon})
                  </Text>
                  <Text style={[styles.summaryVal, { color: colors.primary, fontWeight: '700' }]}>
                    -৳{discountAmount.toLocaleString()} BDT
                  </Text>
                </View>
              )}
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryRow}>
                <Text style={[styles.totalLabel, { color: colors.text }]}>{t('totalPayable')}</Text>
                <Text style={[styles.totalVal, { color: colors.primary }]}>৳{payableAmount.toLocaleString()} BDT</Text>
              </View>
            </View>

            {/* Confirm Payment Button */}
            <TouchableOpacity
              style={[
                styles.payButton,
                { backgroundColor: selectedMethod === 'bkash' ? '#D12053' : selectedMethod === 'nagad' ? '#F7941D' : colors.primary },
              ]}
              onPress={handlePay}
              disabled={isProcessing}
              activeOpacity={0.88}
            >
              {isProcessing ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="lock-closed" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.payButtonText}>
                    {t('confirmPayment')} (৳{payableAmount.toLocaleString()} BDT)
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={[styles.guaranteeText, { color: colors.textMuted }]}>
              🔒 256-Bit SSL Encrypted • Instant LearnPress Course Enrollment
            </Text>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  overlayClose: {
    flex: 1,
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '92%',
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 14,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 18,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  scroll: {
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  lockBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  methodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  methodCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    gap: 8,
  },
  methodName: {
    fontSize: 12,
    flex: 1,
  },
  checkIcon: {
    marginLeft: 'auto',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 46,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  couponRow: {
    flexDirection: 'row',
    gap: 10,
  },
  applyBtn: {
    borderRadius: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  summaryCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginVertical: 14,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  totalVal: {
    fontSize: 18,
    fontWeight: '900',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  guaranteeText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 14,
  },
});
