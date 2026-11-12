import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useSaaS, SAAS_PLAN_FEATURES } from '../../context/SaaSContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { triggerHaptic } from '../../utils/haptics';
import { typography, MIN_TOUCH_TARGET } from '../../theme/typography';
import { shape } from '../../theme/shapes';

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Companion / Reader-App compliant Account Membership & Feature Overview modal.
 * Displays synced membership tier and capabilities without prices or unverified upgrades.
 */
export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ visible, onClose }) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { isBangla } = useLanguage();
  const { subscriptionTier } = useSaaS();
  const { user, isAuthenticated, setAuthModalVisible } = useAuth();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surfaceCard }]}>
            <View style={styles.headerTitleCol}>
              <View style={styles.titleRow}>
                <Ionicons name="sparkles" size={20} color="#F59E0B" />
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  {isBangla ? 'মেম্বারশিপ ও লার্নিং অ্যাক্সেস' : 'Membership & Learning Access'}
                </Text>
              </View>
              <Text style={[styles.headerSub, { color: colors.textMuted }]}>
                {isBangla ? 'আপনার অ্যাকাউন্টের সাথে সিঙ্ক করা সুবিধা' : 'Synced Thriving Skills Account Capabilities'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                onClose();
              }}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close Membership and Learning Access dialog"
            >
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) + 40 }]}
          >
            {/* Current Account Sync Status Banner */}
            <View style={[styles.statusBanner, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.statusLabel, { color: colors.textMuted }]}>
                  {isBangla ? 'বর্তমান অ্যাকাউন্ট স্ট্যাটাস' : 'ACTIVE ACCOUNT STATUS'}
                </Text>
                <Text style={[styles.statusValue, { color: colors.text }]}>
                  {subscriptionTier === 'enterprise'
                    ? 'Enterprise Team Workspace'
                    : subscriptionTier === 'pro'
                    ? 'Pro Executive Member'
                    : 'Starter Member'}
                </Text>
                <Text style={[styles.statusMeta, { color: colors.textMuted }]}>
                  {isAuthenticated
                    ? `${user?.email || user?.username} • Synced`
                    : isBangla
                    ? 'অ্যাকাউন্ট সুবিধা সিঙ্ক করতে সাইন ইন করুন'
                    : 'Sign in with your Thriving Skills account to sync your library'}
                </Text>
              </View>
              {!isAuthenticated && (
                <TouchableOpacity
                  style={[styles.syncSignInBtn, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    triggerHaptic('light');
                    onClose();
                    setAuthModalVisible(true);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={isBangla ? 'সাইন ইন করুন' : 'Sign In'}
                >
                  <Ionicons name="log-in-outline" size={16} color={colors.onPrimary} />
                  <Text style={[styles.syncSignInText, { color: colors.onPrimary }]}>
                    {isBangla ? 'সাইন ইন' : 'Sign In'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Membership Tiers Overview (Informational Reader-App View — No Pricing / No Direct Purchase) */}
            <View style={styles.plansContainer}>
              {/* Starter Tier */}
              <View
                style={[
                  styles.planCard,
                  {
                    backgroundColor: colors.surfaceCard,
                    borderColor: subscriptionTier === 'starter' ? colors.primary : colors.border,
                  },
                  subscriptionTier === 'starter' && styles.activePlanCard,
                ]}
              >
                <View style={styles.planHeader}>
                  <Text style={[styles.planName, { color: colors.text }]}>Starter Member</Text>
                  <Text style={[styles.planDescription, { color: colors.textMuted }]}>
                    এক্সক্লুসিভ ফ্রি কোর্স ও ইন্ট্রোডাক্টরি লেকচার অ্যাক্সেস।
                  </Text>
                </View>

                <View style={styles.featuresList}>
                  <Text style={[styles.featuresHeading, { color: colors.textMuted }]}>অন্তর্ভুক্ত সুবিধাসমূহ:</Text>
                  {['বিনামূল্যে কোর্স ও প্রিভিউ লেকচার', 'কমিউনিটি ডিসকাশন ও কুইজ প্র্যাকটিস', 'কোর্স সিলেবাস ও প্রোগ্রেস ট্র্যাকিং'].map((feat, idx) => (
                    <View key={idx} style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                      <Text style={[styles.featureText, { color: colors.text }]}>{feat}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Pro Executive Tier */}
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
                  <Text style={styles.popularBadgeText}>FULL LIBRARY • PRO EXECUTIVE</Text>
                </View>

                <View style={styles.planHeader}>
                  <Text style={[styles.planName, { color: '#FFFFFF' }]}>Pro Executive</Text>
                  <Text style={[styles.planDescription, { color: '#D1FAE5' }]}>
                    এনরোল করা সকল মাস্টারক্লাস, এআই কো-পাইলট এবং ভেরিফাইড সার্টিফিকেট অ্যাক্সেস।
                  </Text>
                </View>

                <View style={styles.featuresList}>
                  <Text style={[styles.featuresHeading, { color: '#A7F3D0' }]}>প্রো মেম্বারশিপ সুবিধাসমূহ:</Text>
                  {[
                    'সকল এনরোলকৃত মাস্টারক্লাস ও লেসন',
                    'এক্সিকিউটিভ AI কো-পাইলট',
                    'ভেরিফাইড সার্টিফিকেট ও LinkedIn ব্যাজ',
                    'সাপ্তাহিক লাইভ ওয়ার্কশপ ও সামিট অ্যাক্সেস',
                  ].map((feat, idx) => (
                    <View key={idx} style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={16} color="#34D399" />
                      <Text style={[styles.featureText, { color: '#FFFFFF' }]}>{feat}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Enterprise Team Tier */}
              <View
                style={[
                  styles.planCard,
                  {
                    backgroundColor: colors.surfaceCard,
                    borderColor: subscriptionTier === 'enterprise' ? colors.secondary : colors.border,
                  },
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
                </View>

                <View style={styles.featuresList}>
                  <Text style={[styles.featuresHeading, { color: colors.textMuted }]}>এন্টারপ্রাইজ সুবিধা:</Text>
                  {[
                    'টিম সিট ম্যানেজমেন্ট ও প্রোগ্রেস ট্র্যাকিং',
                    'ডিপার্টমেন্টাল স্কিল গ্যাপ অ্যানালিটিক্স',
                    'ডেডিকেটেড এলএমএস সাপোর্ট ও রিপোর্টিং',
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
              <Text style={[styles.matrixTitle, { color: colors.text }]}>মেম্বারশিপ ফিচার তুলনা (Feature Matrix)</Text>
              <View style={[styles.matrixHeaderRow, { borderBottomColor: colors.borderSubtle }]}>
                <Text style={[styles.matrixColHeading, { flex: 2, color: colors.textMuted }]}>Feature</Text>
                <Text style={[styles.matrixColHeading, { flex: 1, textAlign: 'center', color: colors.textMuted }]}>Starter</Text>
                <Text style={[styles.matrixColHeading, { flex: 1, textAlign: 'center', color: colors.primary }]}>Pro</Text>
                <Text style={[styles.matrixColHeading, { flex: 1, textAlign: 'center', color: colors.secondary }]}>Enterprise</Text>
              </View>

              {SAAS_PLAN_FEATURES.map((item) => (
                <View key={item.id} style={[styles.matrixRow, { borderBottomColor: colors.borderSubtle }]}>
                  <Text style={[styles.matrixItemTitle, { flex: 2, color: colors.text }]}>{item.title}</Text>

                  <View style={{ flex: 1, alignItems: 'center' }}>
                    {typeof item.starter === 'string' ? (
                      <Text style={[styles.matrixValText, { color: colors.textMuted }]}>{item.starter}</Text>
                    ) : item.starter ? (
                      <Ionicons name="checkmark" size={16} color={colors.primary} />
                    ) : (
                      <Ionicons name="close" size={16} color={colors.textLight} />
                    )}
                  </View>

                  <View style={{ flex: 1, alignItems: 'center' }}>
                    {typeof item.pro === 'string' ? (
                      <Text style={[styles.matrixValText, { color: colors.primary, fontWeight: '700' }]}>{item.pro}</Text>
                    ) : item.pro ? (
                      <Ionicons name="checkmark" size={16} color={colors.primary} />
                    ) : (
                      <Ionicons name="close" size={16} color={colors.textLight} />
                    )}
                  </View>

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
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
    gap: 12,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  statusValue: {
    ...typography.h4,
    marginTop: 2,
  },
  statusMeta: {
    ...typography.caption,
    marginTop: 2,
  },
  syncSignInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: MIN_TOUCH_TARGET,
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: shape.medium,
  },
  syncSignInText: {
    fontSize: 12,
    fontWeight: '800',
  },
  plansContainer: {
    gap: 18,
    paddingTop: 10,
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
    zIndex: 10,
    elevation: 4,
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
    lineHeight: 12,
    includeFontPadding: false,
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
    marginBottom: 12,
  },
  planName: {
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 12,
    lineHeight: 16,
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
