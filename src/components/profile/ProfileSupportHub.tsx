import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MessengerIcon } from '../common/MessengerIcon';
import { triggerHaptic } from '../../utils/haptics';
import { shape } from '../../theme/shapes';
import { MIN_TOUCH_TARGET } from '../../theme/typography';

interface ProfileSupportHubProps {
  colors: any;
  isDark: boolean;
  isBangla: boolean;
  onOpenHelpFaq: () => void;
  onOpenBlog: () => void;
  onOpenEbook?: () => void;
  onOpenInstructors?: () => void;
  onOpenStorage: () => void;
  pendingSyncCount?: number;
}

export const ProfileSupportHub: React.FC<ProfileSupportHubProps> = ({
  colors,
  isDark,
  isBangla,
  onOpenHelpFaq,
  onOpenBlog,
  onOpenEbook,
  onOpenInstructors,
  onOpenStorage,
  pendingSyncCount = 0,
}) => {
  const handleOpenWhatsApp = () => {
    triggerHaptic('light');
    Linking.openURL('https://wa.me/8801312100288').catch(() => {});
  };

  const handleOpenMessenger = () => {
    triggerHaptic('light');
    Linking.openURL('https://m.me/thrivingskills').catch(() => {});
  };

  const handleCallHotline = () => {
    triggerHaptic('light');
    Linking.openURL('tel:01312100288').catch(() => {});
  };

  const handleSendEmail = () => {
    triggerHaptic('light');
    Linking.openURL('mailto:info@thrivingskill.com').catch(() => {});
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
        {isBangla ? 'সাপোর্ট ও রিসোর্স হাব' : 'SUPPORT & RESOURCE HUB'}
      </Text>

      {/* Modern 4-in-1 Direct Contact Tile Bar */}
      <View
        style={[
          styles.quickContactContainer,
          { backgroundColor: colors.surfaceCard, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.contactBarHeader, { color: colors.textMuted }]}>
          {isBangla ? 'সরাসরি সহায়তা চ্যানেলসমূহ' : 'Direct Support Channels'}
        </Text>

        <View style={styles.contactTilesRow}>
          {/* WhatsApp Tile */}
          <TouchableOpacity
            style={[
              styles.contactTile,
              { backgroundColor: isDark ? 'rgba(37, 211, 102, 0.12)' : '#F0FDF4' },
            ]}
            onPress={handleOpenWhatsApp}
            accessibilityRole="button"
            accessibilityLabel="WhatsApp Support"
            activeOpacity={0.8}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#25D366' }]}>
              <Ionicons name="logo-whatsapp" size={17} color="#FFFFFF" />
            </View>
            <Text style={[styles.tileLabel, { color: colors.text }]}>WhatsApp</Text>
            <Text style={[styles.tileSub, { color: '#16A34A' }]}>
              {isBangla ? 'তাৎক্ষণিক' : 'Instant'}
            </Text>
          </TouchableOpacity>

          {/* Messenger Tile */}
          <TouchableOpacity
            style={[
              styles.contactTile,
              { backgroundColor: isDark ? 'rgba(0, 132, 255, 0.12)' : '#EFF6FF' },
            ]}
            onPress={handleOpenMessenger}
            accessibilityRole="button"
            accessibilityLabel="Messenger Chat"
            activeOpacity={0.8}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#0084FF' }]}>
              <MessengerIcon size={16} color="#FFFFFF" />
            </View>
            <Text style={[styles.tileLabel, { color: colors.text }]}>Messenger</Text>
            <Text style={[styles.tileSub, { color: '#2563EB' }]}>{isBangla ? 'চ্যাট' : 'Chat'}</Text>
          </TouchableOpacity>

          {/* Hotline Call Tile */}
          <TouchableOpacity
            style={[
              styles.contactTile,
              { backgroundColor: isDark ? 'rgba(16, 47, 83, 0.25)' : '#F1F5F9' },
            ]}
            onPress={handleCallHotline}
            accessibilityRole="button"
            accessibilityLabel="Call Hotline"
            activeOpacity={0.8}
          >
            <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
              <Ionicons name="call" size={15} color={colors.onPrimary} />
            </View>
            <Text style={[styles.tileLabel, { color: colors.text }]}>Hotline</Text>
            <Text style={[styles.tileSub, { color: colors.primary }]}>01312100288</Text>
          </TouchableOpacity>

          {/* Email Tile */}
          <TouchableOpacity
            style={[
              styles.contactTile,
              { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2' },
            ]}
            onPress={handleSendEmail}
            accessibilityRole="button"
            accessibilityLabel="Email Support"
            activeOpacity={0.8}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#EF4444' }]}>
              <Ionicons name="mail" size={15} color="#FFFFFF" />
            </View>
            <Text style={[styles.tileLabel, { color: colors.text }]}>Email</Text>
            <Text style={[styles.tileSub, { color: '#DC2626' }]}>
              {isBangla ? 'অফিসিয়াল' : 'Official'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sleek Resource Links Card */}
      <View
        style={[
          styles.resourceCard,
          { backgroundColor: colors.surfaceCard, borderColor: colors.border },
        ]}
      >
        {/* Help & FAQ */}
        <TouchableOpacity
          style={[styles.resourceRow, { borderBottomColor: colors.borderSubtle }]}
          onPress={() => {
            triggerHaptic('light');
            onOpenHelpFaq();
          }}
          accessibilityRole="button"
          accessibilityLabel="Help and FAQ"
        >
          <View style={styles.resourceLeft}>
            <View style={[styles.resourceIconBg, { backgroundColor: 'rgba(13, 148, 136, 0.12)' }]}>
              <Ionicons name="help-circle" size={18} color="#0D9488" />
            </View>
            <View style={styles.resourceTextCol}>
              <Text style={[styles.resourceLabel, { color: colors.text }]}>
                {isBangla ? 'সাহায্য ও প্রশ্নোত্তর (FAQ)' : 'Help & FAQ Center'}
              </Text>
              <Text style={[styles.resourceSub, { color: colors.textMuted }]}>
                {isBangla
                  ? 'সার্টিফিকেট, কোর্স সিঙ্ক ও সমাধান নির্দেশিকা'
                  : 'Certificates, sync & course troubleshooting'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Blog & Articles */}
        <TouchableOpacity
          style={[styles.resourceRow, { borderBottomColor: colors.borderSubtle }]}
          onPress={() => {
            triggerHaptic('light');
            onOpenBlog();
          }}
          accessibilityRole="button"
          accessibilityLabel="Blog and Industry Articles"
        >
          <View style={styles.resourceLeft}>
            <View style={[styles.resourceIconBg, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
              <Ionicons name="newspaper" size={18} color="#8B5CF6" />
            </View>
            <View style={styles.resourceTextCol}>
              <Text style={[styles.resourceLabel, { color: colors.text }]}>
                {isBangla ? 'টিএসএল ব্লগ ও আর্টিকেল' : 'TSL Blog & Industry Articles'}
              </Text>
              <Text style={[styles.resourceSub, { color: colors.textMuted }]}>
                {isBangla
                  ? 'AI, কর্পোরেট লিডারশিপ ও ক্যারিয়ার ইনসাইট'
                  : 'AI, leadership & executive insights'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>

        {/* eBook Library */}
        {onOpenEbook && (
          <TouchableOpacity
            style={[styles.resourceRow, { borderBottomColor: colors.borderSubtle }]}
            onPress={() => {
              triggerHaptic('light');
              onOpenEbook();
            }}
            accessibilityRole="button"
            accessibilityLabel="eBook Library"
          >
            <View style={styles.resourceLeft}>
              <View style={[styles.resourceIconBg, { backgroundColor: 'rgba(227, 66, 52, 0.12)' }]}>
                <Ionicons name="book" size={18} color="#E34234" />
              </View>
              <View style={styles.resourceTextCol}>
                <Text style={[styles.resourceLabel, { color: colors.text }]}>
                  {isBangla ? 'ই-বুক লাইব্রেরি (Free eBook)' : 'Free eBook Library'}
                </Text>
                <Text style={[styles.resourceSub, { color: colors.textMuted }]}>
                  {isBangla
                    ? 'ফ্রি প্রফেশনাল ব্লুপ্রিন্ট ও হ্যান্ডবুক'
                    : 'Executive blueprints & skill handbooks'}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.freeTag,
                { backgroundColor: isDark ? 'rgba(227, 66, 52, 0.2)' : 'rgba(227, 66, 52, 0.12)' },
              ]}
            >
              <Text style={[styles.freeTagText, { color: '#E34234' }]}>FREE</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Our Course Authors */}
        {onOpenInstructors && (
          <TouchableOpacity
            style={[styles.resourceRow, { borderBottomColor: colors.borderSubtle }]}
            onPress={() => {
              triggerHaptic('light');
              onOpenInstructors();
            }}
            accessibilityRole="button"
            accessibilityLabel="Our Course Authors"
          >
            <View style={styles.resourceLeft}>
              <View
                style={[styles.resourceIconBg, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}
              >
                <Ionicons name="people" size={18} color="#10B981" />
              </View>
              <View style={styles.resourceTextCol}>
                <Text style={[styles.resourceLabel, { color: colors.text }]}>
                  {isBangla ? 'কোর্স ফ্যাকাল্টি ও ইন্সট্রাক্টরগণ' : 'Our Course Authors (Faculty)'}
                </Text>
                <Text style={[styles.resourceSub, { color: colors.textMuted }]}>
                  {isBangla
                    ? 'সার্টিফাইড ইন্ডাস্ট্রি বিশেষজ্ঞ ও মেন্টর'
                    : 'Certified industry leaders & masterclass mentors'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}

        {/* Storage & Offline Sync */}
        <TouchableOpacity
          style={[styles.resourceRow, { borderBottomWidth: 0 }]}
          onPress={() => {
            triggerHaptic('light');
            onOpenStorage();
          }}
          accessibilityRole="button"
          accessibilityLabel="Storage and Offline Sync"
        >
          <View style={styles.resourceLeft}>
            <View style={[styles.resourceIconBg, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="server" size={18} color={colors.primary} />
            </View>
            <View style={styles.resourceTextCol}>
              <Text style={[styles.resourceLabel, { color: colors.text }]}>
                {isBangla ? 'স্টোরেজ ও অফলাইন ডাটা সিঙ্ক' : 'Storage & Offline Sync'}
              </Text>
              <Text
                style={[
                  styles.resourceSub,
                  { color: pendingSyncCount > 0 ? '#E34234' : colors.textMuted },
                ]}
              >
                {pendingSyncCount > 0
                  ? isBangla
                    ? `${pendingSyncCount}টি অ্যাকশন অফলাইনে অপেক্ষারত`
                    : `${pendingSyncCount} offline actions pending sync`
                  : isBangla
                    ? 'ক্যাশ ম্যানেজমেন্ট ও অফলাইন কনটেন্ট'
                    : 'Cache management & offline storage'}
              </Text>
            </View>
          </View>
          {pendingSyncCount > 0 ? (
            <View
              style={{
                backgroundColor: '#E34234',
                paddingHorizontal: 7,
                paddingVertical: 2,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800' }}>
                {pendingSyncCount}
              </Text>
            </View>
          ) : (
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  quickContactContainer: {
    borderRadius: shape.large,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  contactBarHeader: {
    fontSize: 10.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  contactTilesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  contactTile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: shape.medium,
    minHeight: 70,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  tileLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  tileSub: {
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 1,
  },
  resourceCard: {
    borderRadius: shape.large,
    borderWidth: 1,
    overflow: 'hidden',
  },
  resourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: MIN_TOUCH_TARGET,
  },
  resourceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
    minWidth: 0,
  },
  resourceIconBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resourceTextCol: {
    flex: 1,
    minWidth: 0,
  },
  resourceLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 1.5,
  },
  resourceSub: {
    fontSize: 10.5,
    lineHeight: 14,
  },
  freeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  freeTagText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
});
