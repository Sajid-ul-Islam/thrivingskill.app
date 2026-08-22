import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLearning } from '../context/LearningContext';
import { Header } from '../components/Header';

interface ProfileScreenProps {
  onOpenCorporateModal: () => void;
  onNavigateTab: (tab: any) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onOpenCorporateModal,
  onNavigateTab,
}) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const { userProgress, certificates } = useLearning();

  const enrolledCount = Object.keys(userProgress).length;
  const completedCount = Object.values(userProgress).filter((p) => p.isCompleted).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="My Profile" subtitle="Executive Member" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View
          style={[
            styles.profileCard,
            { backgroundColor: colors.surfaceCard, borderColor: colors.border },
          ]}
        >
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
            }}
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: colors.text }]}>Alex Rahman</Text>
              <View style={[styles.verifiedBadge, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="checkmark-circle" size={12} color={colors.primary} />
                <Text style={[styles.verifiedText, { color: colors.primary }]}>Verified Pro</Text>
              </View>
            </View>
            <Text style={[styles.email, { color: colors.textMuted }]}>alex.rahman@enterprise.com</Text>
            <Text style={[styles.role, { color: colors.secondary }]}>
              Senior Business Strategist • Apex Corp
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={[
              styles.statBox,
              { backgroundColor: colors.surfaceCard, borderColor: colors.border },
            ]}
            onPress={() => onNavigateTab('MyLearning')}
          >
            <Text style={[styles.statVal, { color: colors.primary }]}>{enrolledCount}</Text>
            <Text style={[styles.statLbl, { color: colors.textMuted }]}>Enrolled</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statBox,
              { backgroundColor: colors.surfaceCard, borderColor: colors.border },
            ]}
            onPress={() => onNavigateTab('MyLearning')}
          >
            <Text style={[styles.statVal, { color: colors.secondary }]}>{completedCount}</Text>
            <Text style={[styles.statLbl, { color: colors.textMuted }]}>Completed</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statBox,
              { backgroundColor: colors.surfaceCard, borderColor: colors.border },
            ]}
            onPress={() => onNavigateTab('MyLearning')}
          >
            <Text style={[styles.statVal, { color: colors.accent }]}>{certificates.length}</Text>
            <Text style={[styles.statLbl, { color: colors.textMuted }]}>Certificates</Text>
          </TouchableOpacity>
        </View>

        {/* Settings Group */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>PREFERENCES</Text>
          <View
            style={[
              styles.cardGroup,
              { backgroundColor: colors.surfaceCard, borderColor: colors.border },
            ]}
          >
            {/* Dark mode switch */}
            <View style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}>
              <View style={styles.settingLeft}>
                <Ionicons
                  name={isDark ? 'moon' : 'sunny'}
                  size={20}
                  color={isDark ? colors.accent : colors.primary}
                />
                <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#CBD5E1', true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Offline downloads */}
            <TouchableOpacity
              style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}
              onPress={() => Alert.alert('Offline Content', 'You have 3 downloaded lessons (142 MB).')}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="cloud-download-outline" size={20} color={colors.text} />
                <Text style={[styles.settingLabel, { color: colors.text }]}>Downloaded Lectures</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Push notifications */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => Alert.alert('Notifications', 'Weekly study reminders are enabled.')}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="notifications-outline" size={20} color={colors.text} />
                <Text style={[styles.settingLabel, { color: colors.text }]}>Study Reminders</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Enterprise & Corporate Upskilling */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>ORGANIZATIONS</Text>
          <TouchableOpacity
            style={[
              styles.corporateCard,
              { backgroundColor: colors.surfaceCard, borderColor: colors.secondary },
            ]}
            onPress={onOpenCorporateModal}
            activeOpacity={0.85}
          >
            <View style={[styles.corpIconBg, { backgroundColor: colors.secondaryLight }]}>
              <Ionicons name="business" size={22} color={colors.secondary} />
            </View>
            <View style={styles.corpInfo}>
              <Text style={[styles.corpTitle, { color: colors.text }]}>
                Corporate & Team Upskilling
              </Text>
              <Text style={[styles.corpSubtitle, { color: colors.textMuted }]}>
                Request custom enterprise training programs for your company.
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color={colors.secondary} />
          </TouchableOpacity>
        </View>

        {/* Support & About */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>ABOUT & SUPPORT</Text>
          <View
            style={[
              styles.cardGroup,
              { backgroundColor: colors.surfaceCard, borderColor: colors.border },
            ]}
          >
            <TouchableOpacity
              style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}
              onPress={() => Alert.alert('Thriving Skills', 'Version 1.0.0 (Expo SDK 51)\nBridge Academic to Industry Skills.')}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="information-circle-outline" size={20} color={colors.text} />
                <Text style={[styles.settingLabel, { color: colors.text }]}>About Thriving Skills</Text>
              </View>
              <Text style={[styles.versionText, { color: colors.textMuted }]}>v1.0.0</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => Alert.alert('Help & Support', 'Reach out to support@thrivingskill.com')}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="headset-outline" size={20} color={colors.text} />
                <Text style={[styles.settingLabel, { color: colors.text }]}>Help & Live Support</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileCard: {
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
  },
  email: {
    fontSize: 12,
    marginBottom: 4,
  },
  role: {
    fontSize: 11,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  statVal: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLbl: {
    fontSize: 11,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  cardGroup: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  versionText: {
    fontSize: 12,
  },
  corporateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  corpIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corpInfo: {
    flex: 1,
  },
  corpTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  corpSubtitle: {
    fontSize: 11,
    lineHeight: 15,
  },
});
