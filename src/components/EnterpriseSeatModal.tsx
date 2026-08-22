import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSaaS } from '../context/SaaSContext';
import { useLearning } from '../context/LearningContext';

interface EnterpriseSeatModalProps {
  visible: boolean;
  onClose: () => void;
}

export const EnterpriseSeatModal: React.FC<EnterpriseSeatModalProps> = ({ visible, onClose }) => {
  const { colors } = useTheme();
  const { inviteTeamMember, activeWorkspace } = useSaaS();
  const { courses } = useLearning();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Operations & Tech');
  const [role, setRole] = useState('Strategist');
  const [selectedCourseId, setSelectedCourseId] = useState('course-1');

  const handleInvite = () => {
    if (!name || !email) {
      Alert.alert('Required Fields', 'Please enter employee name and company email.');
      return;
    }

    inviteTeamMember(name, email, department, role);
    Alert.alert(
      'Invitation Sent! ✉️',
      `An enterprise seat invitation and learning roadmap for "${department}" has been sent to ${email}.`,
      [
        {
          text: 'Done',
          onPress: () => {
            setName('');
            setEmail('');
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.surfaceCard, borderColor: colors.border },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <Ionicons name="person-add" size={20} color={colors.secondary} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                Invite Team Member
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={[styles.seatStatusCard, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
              <Ionicons name="business-outline" size={18} color={colors.secondary} />
              <Text style={[styles.seatStatusText, { color: colors.text }]}>
                Workspace: <Text style={{ fontWeight: '700' }}>{activeWorkspace.companyName || 'Apex Corp'}</Text> ({activeWorkspace.activeSeats || 18} of {activeWorkspace.totalSeats || 25} Seats Allocated)
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Full Name *</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.text },
                ]}
                placeholder="e.g. David Sterling"
                placeholderTextColor={colors.textLight}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Company Email *</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.text },
                ]}
                placeholder="david.s@apexcorp.com"
                placeholderTextColor={colors.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Department</Text>
              <View style={styles.deptRow}>
                {['Operations & Tech', 'Financial Strategy', 'People & Culture', 'Growth & Sales'].map(
                  (d) => (
                    <TouchableOpacity
                      key={d}
                      style={[
                        styles.deptPill,
                        {
                          backgroundColor:
                            department === d ? colors.secondary : colors.surfaceSubtle,
                          borderColor: department === d ? colors.secondary : colors.border,
                        },
                      ]}
                      onPress={() => setDepartment(d)}
                    >
                      <Text
                        style={[
                          styles.deptPillText,
                          { color: department === d ? '#FFFFFF' : colors.text },
                        ]}
                      >
                        {d}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Initial Assigned Masterclass</Text>
              <View style={styles.courseSelectOptions}>
                {courses.slice(0, 3).map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.courseOption,
                      {
                        backgroundColor:
                          selectedCourseId === c.id ? colors.surfaceElevated : colors.surfaceSubtle,
                        borderColor: selectedCourseId === c.id ? colors.secondary : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedCourseId(c.id)}
                  >
                    <Ionicons
                      name={selectedCourseId === c.id ? 'radio-button-on' : 'radio-button-off'}
                      size={16}
                      color={selectedCourseId === c.id ? colors.secondary : colors.textMuted}
                    />
                    <Text style={[styles.courseOptionText, { color: colors.text }]} numberOfLines={1}>
                      {c.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.inviteBtn,
                { backgroundColor: name && email ? colors.secondary : colors.surfaceSubtle },
              ]}
              onPress={handleInvite}
              disabled={!name || !email}
            >
              <Ionicons name="send" size={16} color={name && email ? '#FFFFFF' : colors.textMuted} />
              <Text
                style={[
                  styles.inviteBtnText,
                  { color: name && email ? '#FFFFFF' : colors.textMuted },
                ]}
              >
                Provision Seat & Send Invite
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
  },
  seatStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
    marginBottom: 16,
  },
  seatStatusText: {
    fontSize: 12,
    flex: 1,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  deptRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  deptPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  deptPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  courseSelectOptions: {
    gap: 8,
  },
  courseOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  courseOptionText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  inviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  inviteBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
