import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useLearning } from '../../context/LearningContext';
import { triggerHaptic } from '../../utils/haptics';
import { typography, MIN_TOUCH_TARGET } from '../../theme/typography';
import { shape } from '../../theme/shapes';
import { useResponsive } from '../../theme/responsive';
import { LegalPolicyModal, LegalTabKey } from './LegalPolicyModal';
import { AboutTabKey, getAboutTabs } from './about/aboutTSL.data';
import { AboutOverviewTab, AboutPillarsTab } from './about/AboutOverviewPillarsTabs';
import { AboutPartnersTab, AboutSummitsTab } from './about/AboutPartnersSummitsTabs';
import { AboutLeadershipTab, AboutContactTab } from './about/AboutLeadershipContactTabs';

export type { AboutTabKey };

interface AboutTSLModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: any) => void;
  initialTab?: AboutTabKey;
}

export const AboutTSLModal: React.FC<AboutTSLModalProps> = ({
  visible,
  onClose,
  initialTab = 'overview',
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();
  const { siteBranding } = useLearning();
  const insets = useSafeAreaInsets();
  const { containerClampStyle } = useResponsive();
  const [activeTab, setActiveTab] = useState<AboutTabKey>(initialTab);
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [legalInitialTab, setLegalInitialTab] = useState<LegalTabKey>('terms');

  useEffect(() => {
    if (visible && initialTab) {
      setActiveTab(initialTab);
    }
  }, [visible, initialTab]);

  if (!visible) return null;

  const handleOpenUrl = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.surfaceCard,
              borderBottomColor: colors.border,
              paddingTop: Math.max(insets.top, 14),
            },
          ]}
        >
          <View style={styles.headerTitleRow}>
            <Image
              source={require('../../../assets/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.companyTitle, { color: colors.text }]}>
                Thriving<Text style={{ color: '#E34234' }}>Skills</Text> Limited
              </Text>
              <Text style={[styles.companySubtitle, { color: colors.textMuted }]}>
                {isBangla
                  ? siteBranding?.taglineBn || 'দক্ষ জাতি গঠনে মানুষের ক্ষমতায়ন'
                  : siteBranding?.tagline || 'Empowering People, Building a Skilled Nation'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
              onPress={() => {
                triggerHaptic('light');
                onClose();
              }}
              accessibilityRole="button"
              accessibilityLabel="Close About Thriving Skills modal"
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContainer}
          >
            {getAboutTabs(isBangla).map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.tabButton,
                    {
                      backgroundColor: isActive ? colors.primary : colors.surfaceSubtle,
                      borderColor: isActive ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setActiveTab(tab.key)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={tab.label}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={14}
                    color={isActive ? colors.onPrimary : colors.textMuted}
                  />
                  <Text
                    style={[styles.tabLabel, { color: isActive ? colors.onPrimary : colors.text }]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.contentBody,
            containerClampStyle,
            { paddingBottom: Math.max(insets.bottom, 24) + 20 },
          ]}
        >
          {activeTab === 'overview' && (
            <AboutOverviewTab colors={colors} isDark={isDark} isBangla={isBangla} />
          )}
          {activeTab === 'pillars' && (
            <AboutPillarsTab colors={colors} isDark={isDark} isBangla={isBangla} />
          )}
          {activeTab === 'partners' && (
            <AboutPartnersTab colors={colors} isDark={isDark} isBangla={isBangla} />
          )}
          {activeTab === 'summits' && (
            <AboutSummitsTab colors={colors} isDark={isDark} isBangla={isBangla} />
          )}
          {activeTab === 'leadership' && (
            <AboutLeadershipTab
              colors={colors}
              isDark={isDark}
              isBangla={isBangla}
              onOpenUrl={handleOpenUrl}
            />
          )}
          {activeTab === 'contact' && (
            <AboutContactTab
              colors={colors}
              isDark={isDark}
              isBangla={isBangla}
              onOpenUrl={handleOpenUrl}
              onOpenLegalTab={(tab) => {
                setLegalInitialTab(tab);
                setLegalModalVisible(true);
              }}
            />
          )}
        </ScrollView>
      </View>

      <LegalPolicyModal
        visible={legalModalVisible}
        onClose={() => setLegalModalVisible(false)}
        initialTab={legalInitialTab}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 8,
  },
  companyTitle: { ...typography.h3 },
  companySubtitle: {
    ...typography.caption,
    marginTop: 1,
  },
  closeBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: shape.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  contentBody: {
    padding: 16,
  },
});
