import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSaaS } from '../context/SaaSContext';
import { useLearning } from '../context/LearningContext';
import { Header } from '../components/Header';
import { EnterpriseSeatModal } from '../components/EnterpriseSeatModal';

interface EnterpriseTeamScreenProps {
  onOpenSubscription: () => void;
  onOpenNotifications: () => void;
  onNavigateToCourse: (courseId: string) => void;
  onOpenDrawer?: () => void;
}

export const EnterpriseTeamScreen: React.FC<EnterpriseTeamScreenProps> = ({
  onOpenSubscription,
  onOpenNotifications,
  onNavigateToCourse,
  onOpenDrawer,
}) => {
  const { colors, isDark } = useTheme();
  const {
    activeWorkspace,
    teamMembers,
    assignCourseToMember,
    subscriptionTier,
  } = useSaaS();
  const { courses } = useLearning();

  const [searchMember, setSearchMember] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [inviteModalVisible, setInviteModalVisible] = useState(false);

  const departments = ['All', 'Financial Strategy', 'Operations & Tech', 'People & Culture', 'Growth & Commercial'];

  const filteredMembers = teamMembers.filter((m) => {
    const matchesDept = selectedDepartment === 'All' || m.department === selectedDepartment;
    const matchesSearch =
      !searchMember ||
      m.name.toLowerCase().includes(searchMember.toLowerCase()) ||
      m.email.toLowerCase().includes(searchMember.toLowerCase()) ||
      m.role.toLowerCase().includes(searchMember.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const handleExportReport = () => {
    Alert.alert(
      'Exporting Enterprise Audit 📄',
      `Apex Corp Workforce Competency & Compliance Report (Q3 2026) has been generated and queued for download.`,
      [{ text: 'OK' }]
    );
  };

  const handleAssignPrompt = (memberId: string, memberName: string) => {
    Alert.alert(
      `Assign Masterclass to ${memberName}`,
      'Select a prioritized executive curriculum:',
      courses.slice(0, 3).map((c) => ({
        text: c.title,
        onPress: () => {
          assignCourseToMember(memberId, c.id);
          Alert.alert('Assigned ✅', `"${c.title}" assigned to ${memberName}. Due date set to 30 days.`);
        },
      }))
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Enterprise Hub"
        subtitle="Workforce Skill Transformation"
        onOpenSubscription={onOpenSubscription}
        onOpenNotifications={onOpenNotifications}
        onOpenDrawer={onOpenDrawer}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Workspace Banner */}
        <View
          style={[
            styles.orgBanner,
            {
              backgroundColor: isDark ? colors.surfaceCard : '#1E1B4B',
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.orgHeaderRow}>
            <View style={styles.orgBadge}>
              <Ionicons name="business" size={14} color="#818CF8" />
              <Text style={styles.orgBadgeText}>ENTERPRISE WORKSPACE</Text>
            </View>
            <TouchableOpacity style={styles.exportReportBtn} onPress={handleExportReport}>
              <Ionicons name="document-text-outline" size={14} color="#FFFFFF" />
              <Text style={styles.exportReportText}>Export Audit (CSV)</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.orgTitle}>
            {activeWorkspace.companyName || 'Apex Corp Technologies'}
          </Text>
          <Text style={styles.orgSubtitle}>
            Centralized seat allocation, compliance tracking, and skills gap diagnostic analytics.
          </Text>

          {/* KPI Dashboard Strip */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiVal}>{activeWorkspace.activeSeats || 18}/{activeWorkspace.totalSeats || 25}</Text>
              <Text style={styles.kpiLbl}>Active Seats</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiBox}>
              <Text style={styles.kpiVal}>78%</Text>
              <Text style={styles.kpiLbl}>Completion Rate</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiBox}>
              <Text style={styles.kpiVal}>342h</Text>
              <Text style={styles.kpiLbl}>Learning Hours</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiBox}>
              <Text style={styles.kpiVal}>29</Text>
              <Text style={styles.kpiLbl}>Certificates</Text>
            </View>
          </View>

          {/* Visual Seat Gauge & Quick Invite */}
          <View style={styles.seatGaugeContainer}>
            <View style={styles.seatGaugeHeader}>
              <Text style={styles.seatGaugeTitle}>Seat Licensing Capacity</Text>
              <Text style={styles.seatGaugeSub}>
                {(activeWorkspace.totalSeats || 25) - (activeWorkspace.activeSeats || 18)} seats available to assign
              </Text>
            </View>
            <View style={styles.seatTrack}>
              <View
                style={[
                  styles.seatFill,
                  {
                    width: `${Math.round(((activeWorkspace.activeSeats || 18) / (activeWorkspace.totalSeats || 25)) * 100)}%`,
                  },
                ]}
              />
            </View>
            <TouchableOpacity
              style={styles.inviteMemberBtn}
              onPress={() => setInviteModalVisible(true)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Invite colleague to enterprise workspace"
            >
              <Ionicons name="person-add" size={14} color="#FFFFFF" />
              <Text style={styles.inviteMemberBtnText}>Invite Colleague / Allocate Seat</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Skill Gap Benchmark Radar Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Department Competency Matrix</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>AI-Assessed Readiness</Text>
          </View>

          <View style={[styles.matrixCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
            {[
              { domain: 'Generative AI & Automation', benchmark: 88, progressColor: '#6366F1' },
              { domain: 'Financial Modeling & Valuation', benchmark: 82, progressColor: '#0EA5E9' },
              { domain: 'Data Analytics & PowerBI', benchmark: 74, progressColor: '#10B981' },
              { domain: 'Strategic Leadership & Storytelling', benchmark: 91, progressColor: '#F59E0B' },
            ].map((item, idx) => (
              <View key={idx} style={styles.skillRow}>
                <View style={styles.skillHeader}>
                  <Text style={[styles.skillDomain, { color: colors.text }]}>{item.domain}</Text>
                  <Text style={[styles.skillScore, { color: item.progressColor }]}>{item.benchmark}% Proficiency</Text>
                </View>
                <View style={[styles.skillTrack, { backgroundColor: colors.surfaceSubtle }]}>
                  <View
                    style={[
                      styles.skillFill,
                      { backgroundColor: item.progressColor, width: `${item.benchmark}%` },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Team Members Roster */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Team Members ({filteredMembers.length})</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                Manage enrollments & track progress
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.inviteCTA, { backgroundColor: colors.secondary }]}
              onPress={() => setInviteModalVisible(true)}
            >
              <Ionicons name="person-add" size={14} color="#FFFFFF" />
              <Text style={styles.inviteCTAText}>Invite Member</Text>
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View style={[styles.searchBox, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
            <Ionicons name="search" size={16} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search employee by name, email, or role..."
              placeholderTextColor={colors.textLight}
              value={searchMember}
              onChangeText={setSearchMember}
            />
          </View>

          {/* Department filter scroll */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.deptScroll}>
            {departments.map((d) => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.deptPill,
                  {
                    backgroundColor:
                      selectedDepartment === d ? colors.secondary : colors.surfaceSubtle,
                    borderColor: selectedDepartment === d ? colors.secondary : colors.border,
                  },
                ]}
                onPress={() => setSelectedDepartment(d)}
              >
                <Text
                  style={[
                    styles.deptPillText,
                    { color: selectedDepartment === d ? '#FFFFFF' : colors.textMuted },
                  ]}
                >
                  {d}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Member Cards */}
          <View style={styles.membersList}>
            {filteredMembers.map((member) => (
              <View
                key={member.id}
                style={[
                  styles.memberCard,
                  { backgroundColor: colors.surfaceCard, borderColor: colors.border },
                ]}
              >
                <View style={styles.memberTopRow}>
                  <Image source={{ uri: member.avatar }} style={styles.memberAvatar} />
                  <View style={styles.memberInfo}>
                    <Text style={[styles.memberName, { color: colors.text }]}>{member.name}</Text>
                    <Text style={[styles.memberRole, { color: colors.primary }]}>
                      {member.role} • {member.department}
                    </Text>
                    <Text style={[styles.memberEmail, { color: colors.textMuted }]}>{member.email}</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.assignBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
                    onPress={() => handleAssignPrompt(member.id, member.name)}
                  >
                    <Ionicons name="add" size={14} color={colors.primary} />
                    <Text style={[styles.assignBtnText, { color: colors.primary }]}>Assign</Text>
                  </TouchableOpacity>
                </View>

                {/* Progress bar */}
                <View style={styles.memberProgressSection}>
                  <View style={styles.memberProgressRow}>
                    <Text style={[styles.progressLabel, { color: colors.textMuted }]}>
                      Curriculum Progress: {member.assignedCourseIds.length} Assigned ({member.completedCoursesCount} Completed)
                    </Text>
                    <Text style={[styles.progressPercent, { color: colors.primary }]}>
                      {member.progressPercent}%
                    </Text>
                  </View>
                  <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSubtle }]}>
                    <View
                      style={[
                        styles.progressFill,
                        { backgroundColor: colors.primary, width: `${member.progressPercent}%` },
                      ]}
                    />
                  </View>
                </View>

                {/* Skills Mastered Tags */}
                {member.skillsMastered.length > 0 && (
                  <View style={styles.skillsTagRow}>
                    {member.skillsMastered.map((skill, sIdx) => (
                      <View
                        key={sIdx}
                        style={[styles.skillTag, { backgroundColor: colors.surfaceSubtle }]}
                      >
                        <Text style={[styles.skillTagText, { color: colors.text }]}>✓ {skill}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Invite Modal */}
      <EnterpriseSeatModal
        visible={inviteModalVisible}
        onClose={() => setInviteModalVisible(false)}
      />
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
  orgBanner: {
    margin: 16,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
  },
  orgHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orgBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orgBadgeText: {
    color: '#818CF8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  exportReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  exportReportText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  orgTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  orgSubtitle: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 16,
    marginBottom: 16,
  },
  kpiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingVertical: 10,
    borderRadius: 12,
  },
  kpiBox: {
    alignItems: 'center',
  },
  kpiVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  kpiLbl: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  kpiDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  seatGaugeContainer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  seatGaugeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  seatGaugeTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  seatGaugeSub: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '600',
  },
  seatTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
    marginBottom: 10,
  },
  seatFill: {
    height: '100%',
    backgroundColor: '#38BDF8',
    borderRadius: 3,
  },
  inviteMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  inviteMemberBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  matrixCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    marginBottom: 14,
  },
  skillRow: {
    gap: 6,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skillDomain: {
    fontSize: 12,
    fontWeight: '600',
  },
  skillScore: {
    fontSize: 11,
    fontWeight: '700',
  },
  skillTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  skillFill: {
    height: '100%',
    borderRadius: 3,
  },
  inviteCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  inviteCTAText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  deptScroll: {
    gap: 6,
    paddingBottom: 10,
  },
  deptPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  deptPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  membersList: {
    gap: 12,
  },
  memberCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  memberTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
  },
  memberRole: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  memberEmail: {
    fontSize: 11,
  },
  assignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    gap: 2,
  },
  assignBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  memberProgressSection: {
    marginTop: 12,
  },
  memberProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 11,
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressTrack: {
    height: 5,
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  skillsTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  skillTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  skillTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
