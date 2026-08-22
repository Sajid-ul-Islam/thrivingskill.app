import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSaaS, SAAS_PLAN_FEATURES } from '../context/SaaSContext';
import { SubscriptionTier } from '../types';

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ visible, onClose }) => {
  const { colors, isDark } = useTheme();
  const { subscriptionTier, billingInterval, setSubscriptionTier, setBillingInterval } = useSaaS();
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(subscriptionTier);
  const [currency, setCurrency] = useState<'BDT' | 'USD'>('BDT');

  const isAnnual = billingInterval === 'annual';

  const handleUpgrade = (tier: SubscriptionTier) => {
    setSubscriptionTier(tier);
    Alert.alert(
      'Plan Updated Successfully! 🚀',
      `You are now on the ${
        tier === 'starter'
          ? 'Starter (Free)'
          : tier === 'pro'
          ? 'Pro Executive'
          : 'Enterprise Scale'
      } plan (${isAnnual ? 'Billed Annually' : 'Billed Monthly'}). All courses and AI tools are immediately unlocked.`,
      [{ text: 'Continue', onPress: onClose }]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surfaceCard }]}>
            <View style={styles.headerTitleCol}>
              <View style={styles.titleRow}>
                <Ionicons name="sparkles" size={20} color="#F59E0B" />
                <Text style={[styles.headerTitle, { color: colors.text }]}>স্মার্ট লার্নিং সাবস্ক্রিপশন</Text>
              </View>
              <Text style={[styles.headerSub, { color: colors.textMuted }]}>
                Thriving Skills Course & Service Subscription
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Currency & Interval Controls */}
            <View style={styles.controlsRow}>
              {/* Currency Toggle */}
              <View style={[styles.currencyWrapper, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={[styles.currencyBtn, currency === 'BDT' && { backgroundColor: colors.primary }]}
                  onPress={() => setCurrency('BDT')}
                >
                  <Text style={[styles.currencyText, { color: currency === 'BDT' ? '#FFFFFF' : colors.textMuted }]}>
                    ৳ BDT
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.currencyBtn, currency === 'USD' && { backgroundColor: colors.primary }]}
                  onPress={() => setCurrency('USD')}
                >
                  <Text style={[styles.currencyText, { color: currency === 'USD' ? '#FFFFFF' : colors.textMuted }]}>
                    $ USD
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Billing Interval Switcher */}
              <View style={[styles.billingToggleWrapper, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={[
                    styles.billingToggleBtn,
                    !isAnnual && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setBillingInterval('monthly')}
                >
                  <Text style={[styles.billingToggleText, { color: !isAnnual ? '#FFFFFF' : colors.textMuted }]}>
                    Monthly
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.billingToggleBtn,
                    isAnnual && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setBillingInterval('annual')}
                >
                  <Text style={[styles.billingToggleText, { color: isAnnual ? '#FFFFFF' : colors.textMuted }]}>
                    Annual
                  </Text>
                  <View style={styles.discountPill}>
                    <Text style={styles.discountText}>-20%</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Plans Grid */}
            <View style={styles.plansContainer}>
              {/* Starter Plan */}
              <View
                style={[
                  styles.planCard,
                  { backgroundColor: colors.surfaceCard, borderColor: selectedTier === 'starter' ? colors.primary : colors.border },
                  selectedTier === 'starter' && styles.activePlanCard,
                ]}
              >
                <View style={styles.planHeader}>
                  <Text style={[styles.planName, { color: colors.text }]}>Starter Free</Text>
                  <Text style={[styles.planDescription, { color: colors.textMuted }]}>
                    এক্সক্লুসিভ ফ্রি কোর্স ও ইন্ট্রোডাক্টরি লেকচার ট্রায়াল।
                  </Text>
                  <View style={styles.priceContainer}>
                    <Text style={[styles.planPrice, { color: colors.text }]}>
                      {currency === 'BDT' ? '৳০' : '$0'}
                    </Text>
                    <Text style={[styles.planPeriod, { color: colors.textMuted }]}>/ চিরদিনের জন্য ফ্রি</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.planCTA,
                    subscriptionTier === 'starter'
                      ? { backgroundColor: colors.surfaceSubtle }
                      : { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, borderWidth: 1 },
                  ]}
                  onPress={() => handleUpgrade('starter')}
                  disabled={subscriptionTier === 'starter'}
                >
                  <Text
                    style={[
                      styles.planCTAText,
                      { color: subscriptionTier === 'starter' ? colors.textMuted : colors.text },
                    ]}
                  >
                    {subscriptionTier === 'starter' ? 'Current Plan' : 'Downgrade to Starter'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.featuresList}>
                  <Text style={[styles.featuresHeading, { color: colors.textMuted }]}>সুবিধাসমূহ:</Text>
                  {['৩টি প্রিভিউ লেকচার প্রতি কোর্সে', 'কমিউনিটি ডিসকাশন প্ল্যাটফর্ম', 'কোর্সের বেসিক সিলেবাস ওভারভিউ'].map((feat, idx) => (
                    <View key={idx} style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                      <Text style={[styles.featureText, { color: colors.text }]}>{feat}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Pro Executive Plan */}
              <View
                style={[
                  styles.planCard,
                  {
                    backgroundColor: isDark ? colors.surfaceCard : '#064E3B',
                    borderColor: '#10B981',
                    borderWidth: 2,
                  },
                ]}
              >
                <View style={styles.popularBadge}>
                  <Ionicons name="flash" size={12} color="#FFFFFF" />
                  <Text style={styles.popularBadgeText}>সেরা অফার • প্রফেশনালস চয়েস</Text>
                </View>

                <View style={styles.planHeader}>
                  <Text style={[styles.planName, { color: '#FFFFFF' }]}>Pro Executive Annual</Text>
                  <Text style={[styles.planDescription, { color: '#D1FAE5' }]}>
                    ৩০০+ প্রিমিয়াম কোর্স, এআই কো-পাইলট এবং ভেরিফাইড সার্টিফিকেটে আনলিমিটেড অ্যাক্সেস।
                  </Text>
                  <View style={styles.priceContainer}>
                    <Text style={[styles.planPrice, { color: '#FFFFFF' }]}>
                      {currency === 'BDT'
                        ? isAnnual
                          ? '৳২,৯০০'
                          : '৳২৯০'
                        : isAnnual
                        ? '$290'
                        : '$29'}
                    </Text>
                    <Text style={[styles.planPeriod, { color: '#A7F3D0' }]}>
                      {isAnnual ? '/ year (৳২৪১/মাস)' : '/ month'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.planCTA,
                    { backgroundColor: '#10B981' },
                  ]}
                  onPress={() => handleUpgrade('pro')}
                >
                  <Text style={[styles.planCTAText, { color: '#FFFFFF', fontWeight: '800' }]}>
                    {subscriptionTier === 'pro' ? 'Current Active Plan' : 'সাবস্ক্রিপশন নিন (Upgrade)'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.featuresList}>
                  <Text style={[styles.featuresHeading, { color: '#A7F3D0' }]}>প্রো মেম্বারশিপের সুবিধাসমূহ:</Text>
                  {[
                    '৩০০+ সকল রেকর্ডেড মাস্টারক্লাস আনলকড',
                    'এক্সিকিউটিভ AI কো-পাইলট (সলিউশন প্রম্পট জেনারেটর)',
                    'প্রতিটি কোর্সে ইন্ডাস্ট্রি ভেরিফাইড সার্টিফিকেট ও LinkedIn ব্যাজ',
                    'সাপ্তাহিক লাইভ ট্রেনিং ও সামিটে ফ্রি সিট',
                    'অফলাইন ভিডিও ডাউনলোড (মোবাইল অ্যাপ)',
                    'ডাউনলোডযোগ্য এক্সেল ও ফিন্যান্সিয়াল মডেল ফাইল',
                  ].map((feat, idx) => (
                    <View key={idx} style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={16} color="#34D399" />
                      <Text style={[styles.featureText, { color: '#FFFFFF' }]}>{feat}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Enterprise Team Plan */}
              <View
                style={[
                  styles.planCard,
                  { backgroundColor: colors.surfaceCard, borderColor: colors.secondary },
                ]}
              >
                <View style={[styles.enterpriseBadge, { backgroundColor: colors.secondaryLight }]}>
                  <Ionicons name="business" size={12} color={colors.secondary} />
                  <Text style={[styles.enterpriseBadgeText, { color: colors.secondary }]}>ENTERPRISE TEAMS</Text>
                </View>

                <View style={styles.planHeader}>
                  <Text style={[styles.planName, { color: colors.text }]}>Enterprise Scale</Text>
                  <Text style={[styles.planDescription, { color: colors.textMuted }]}>
                    অর্গানাইজেশনের টিম আপস্কিলিং, সিট অ্যালোকেশন ও স্কিল গ্যাপ অ্যানালিটিক্স।
                  </Text>
                  <View style={styles.priceContainer}>
                    <Text style={[styles.planPrice, { color: colors.text }]}>
                      {currency === 'BDT'
                        ? isAnnual
                          ? '৳৬,৫০০'
                          : '৳৭৯০'
                        : isAnnual
                        ? '$65'
                        : '$79'}
                    </Text>
                    <Text style={[styles.planPeriod, { color: colors.textMuted }]}>
                      / seat / mo
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.planCTA,
                    { backgroundColor: colors.secondary },
                  ]}
                  onPress={() => handleUpgrade('enterprise')}
                >
                  <Text style={[styles.planCTAText, { color: '#FFFFFF' }]}>
                    {subscriptionTier === 'enterprise' ? 'Current Enterprise Plan' : 'টিম লাইসেন্স নিন'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.featuresList}>
                  <Text style={[styles.featuresHeading, { color: colors.textMuted }]}>এন্টারপ্রাইজ সুবিধা:</Text>
                  {[
                    '১০ থেকে ৫০০+ টিম সিট ম্যানেজমেন্ট পোর্টাল',
                    'ডিপার্টমেন্টাল স্কিল গ্যাপ রাডার ও কমপ্লায়েন্স রিপোর্ট (CSV)',
                    'ম্যানেজার কোর্স অ্যাসাইনমেন্ট ও ডেডলাইন ট্র্যাকিং',
                    'কাস্টম LMS ইন্টিগ্রেশন ও ডেডিকেটেড অ্যাকাউন্ট ম্যানেজার',
                  ].map((feat, idx) => (
                    <View key={idx} style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.secondary} />
                      <Text style={[styles.featureText, { color: colors.text }]}>{feat}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Feature Comparison Matrix Table */}
            <View style={[styles.matrixCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
              <Text style={[styles.matrixTitle, { color: colors.text }]}>প্ল্যান ফিচার তুলনা (Feature Matrix)</Text>
              <View style={[styles.matrixHeaderRow, { borderBottomColor: colors.borderSubtle }]}>
                <Text style={[styles.matrixColHeading, { flex: 2, color: colors.textMuted }]}>Feature</Text>
                <Text style={[styles.matrixColHeading, { flex: 1, textAlign: 'center', color: colors.textMuted }]}>Starter</Text>
                <Text style={[styles.matrixColHeading, { flex: 1, textAlign: 'center', color: colors.primary }]}>Pro</Text>
                <Text style={[styles.matrixColHeading, { flex: 1, textAlign: 'center', color: colors.secondary }]}>Enterprise</Text>
              </View>

              {SAAS_PLAN_FEATURES.map((item) => (
                <View key={item.id} style={[styles.matrixRow, { borderBottomColor: colors.borderSubtle }]}>
                  <Text style={[styles.matrixItemTitle, { flex: 2, color: colors.text }]}>{item.title}</Text>

                  {/* Starter */}
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    {typeof item.starter === 'string' ? (
                      <Text style={[styles.matrixValText, { color: colors.textMuted }]}>{item.starter}</Text>
                    ) : item.starter ? (
                      <Ionicons name="checkmark" size={16} color={colors.primary} />
                    ) : (
                      <Ionicons name="close" size={16} color={colors.textLight} />
                    )}
                  </View>

                  {/* Pro */}
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    {typeof item.pro === 'string' ? (
                      <Text style={[styles.matrixValText, { color: colors.primary, fontWeight: '700' }]}>{item.pro}</Text>
                    ) : item.pro ? (
                      <Ionicons name="checkmark" size={16} color={colors.primary} />
                    ) : (
                      <Ionicons name="close" size={16} color={colors.textLight} />
                    )}
                  </View>

                  {/* Enterprise */}
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    {typeof item.enterprise === 'string' ? (
                      <Text style={[styles.matrixValText, { color: colors.secondary, fontWeight: '700' }]}>{item.enterprise}</Text>
                    ) : item.enterprise ? (
                      <Ionicons name="checkmark" size={16} color={colors.secondary} />
                    ) : (
                      <Ionicons name="close" size={16} color={colors.textLight} />
                    )}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '92%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitleCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 10,
  },
  currencyWrapper: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
  },
  currencyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
  },
  currencyText: {
    fontSize: 12,
    fontWeight: '700',
  },
  billingToggleWrapper: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
  },
  billingToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 7,
    gap: 4,
  },
  billingToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  discountPill: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },
  plansContainer: {
    gap: 16,
  },
  planCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    position: 'relative',
  },
  activePlanCard: {
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 18,
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  enterpriseBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    marginBottom: 8,
  },
  enterpriseBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  planHeader: {
    marginBottom: 14,
  },
  planName: {
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  planPrice: {
    fontSize: 26,
    fontWeight: '800',
  },
  planPeriod: {
    fontSize: 12,
  },
  planCTA: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  planCTAText: {
    fontSize: 13,
    fontWeight: '700',
  },
  featuresList: {
    gap: 8,
  },
  featuresHeading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  matrixCard: {
    marginTop: 24,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  matrixTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 12,
  },
  matrixHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  matrixColHeading: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  matrixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  matrixItemTitle: {
    fontSize: 12,
    fontWeight: '600',
    paddingRight: 6,
  },
  matrixValText: {
    fontSize: 10,
    textAlign: 'center',
  },
});
