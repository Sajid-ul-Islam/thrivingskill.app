import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { shape } from '../../theme/shapes';
import { typography, MIN_TOUCH_TARGET } from '../../theme/typography';
import { SpringPressable } from '../common/SpringPressable';
import { triggerHaptic } from '../../utils/haptics';
import { SiteNavigationService, PortalServiceItem } from '../../services/site/siteNavigationService';

interface ServicesModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenInquiry?: (serviceTitle?: string) => void;
  initialServiceId?: string;
}

export const ServicesModal: React.FC<ServicesModalProps> = ({
  visible,
  onClose,
  onOpenInquiry,
  initialServiceId,
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();
  const insets = useSafeAreaInsets();
  const [expandedId, setExpandedId] = useState<string | null>(initialServiceId || null);

  if (!visible) return null;

  const services = SiteNavigationService.getServices();

  const handleToggleExpand = (id: string) => {
    triggerHaptic('selection');
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleInquiryPress = (service: PortalServiceItem) => {
    triggerHaptic('medium');
    onClose();
    if (onOpenInquiry) {
      onOpenInquiry(service.title);
    } else {
      Linking.openURL(service.webUrl).catch(() => {});
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              borderBottomColor: colors.border,
              backgroundColor: colors.surfaceCard,
              paddingTop: insets.top ? insets.top + 8 : 16,
            },
          ]}
        >
          <View style={styles.headerLeft}>
            <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : '#E0F2FE' }]}>
              <Ionicons name="briefcase" size={20} color={isDark ? '#38BDF8' : '#0284C7'} />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {isBangla ? 'কর্পোরেট ও প্রাতিষ্ঠানিক সেবা' : 'Services & Enterprise Solutions'}
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                {isBangla ? 'ডিজিটাল রূপান্তর ও কর্পোরেট গ্রোথ' : 'Strategic Advisory & Workforce Enablement'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeButton, { backgroundColor: colors.surfaceSubtle }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Close Services modal"
          >
            <Ionicons name="close" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Services List */}
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + 20 }]}>
          {/* Top National Advisory Banner */}
          <View style={[styles.highlightBanner, { backgroundColor: isDark ? '#1C2E46' : '#EFF6FF', borderColor: colors.border }]}>
            <Ionicons name="shield-checkmark" size={22} color={colors.primary} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.bannerTitle, { color: colors.primary }]}>
                {isBangla ? 'জাতীয় পর্যায়ে বিশ্বস্ত পরামর্শক' : 'Trusted Institutional Partner'}
              </Text>
              <Text style={[styles.bannerText, { color: colors.text }]}>
                {isBangla
                  ? 'ডাকসু (ঢাবি), এনএসইউ এবং শীর্ষস্থানীয় বহুজাতিক প্রতিষ্ঠানের সাথে স্কিল ডেভেলপমেন্ট ও ডিজিটাল ট্রান্সফরমেশনে কার্যকর অংশীদারিত্ব।'
                  : 'Collaborating with DUCSU (University of Dhaka), NSU, and leading enterprises to build a future-ready, skilled workforce.'}
              </Text>
            </View>
          </View>

          {services.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <View
                key={item.id}
                style={[
                  styles.serviceCard,
                  {
                    backgroundColor: colors.surfaceCard,
                    borderColor: isExpanded ? colors.primary : colors.border,
                    borderWidth: isExpanded ? 1.5 : 1,
                    shadowColor: colors.cardShadow,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.cardHeader}
                  onPress={() => handleToggleExpand(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.serviceIconWrap, { backgroundColor: isDark ? '#24364B' : '#F1F5F9' }]}>
                    <Ionicons name={item.icon as any} size={22} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.categoryTag, { color: colors.primary }]}>
                      {item.category.toUpperCase()}
                    </Text>
                    <Text style={[styles.serviceTitle, { color: colors.text }]}>
                      {isBangla ? item.banglaTitle : item.title}
                    </Text>
                  </View>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>

                <Text style={[styles.serviceDesc, { color: colors.textMuted }]}>
                  {isBangla ? item.banglaDescription : item.description}
                </Text>

                {isExpanded && (
                  <View style={styles.expandedSection}>
                    <Text style={[styles.deliverablesTitle, { color: colors.text }]}>
                      {isBangla ? 'মূল সমাধান ও সুবিধাসমূহ:' : 'Key Deliverables & Solutions:'}
                    </Text>
                    {(isBangla ? item.banglaBullets : item.bullets).map((bullet, idx) => (
                      <View key={idx} style={styles.bulletRow}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginTop: 2 }} />
                        <Text style={[styles.bulletText, { color: colors.text }]}>{bullet}</Text>
                      </View>
                    ))}

                    <View style={styles.actionRow}>
                      <SpringPressable
                        onPress={() => handleInquiryPress(item)}
                        style={[styles.inquireBtn, { backgroundColor: colors.accent }]}
                        activeScale={0.96}
                      >
                        <Ionicons name="mail-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.inquireBtnText}>
                          {isBangla ? 'পরামর্শ ও সেবা নিন' : 'Inquire / Book Consultation'}
                        </Text>
                      </SpringPressable>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: shape.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  closeButton: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: shape.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  highlightBanner: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: shape.large,
    borderWidth: 1,
    gap: 12,
    marginBottom: 4,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  bannerText: {
    fontSize: 12,
    lineHeight: 17,
  },
  serviceCard: {
    borderRadius: shape.large,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  serviceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: shape.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  serviceDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  expandedSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 116, 139, 0.2)',
  },
  deliverablesTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  bulletText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
  },
  actionRow: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  inquireBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: shape.medium,
    minHeight: 38,
  },
  inquireBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
