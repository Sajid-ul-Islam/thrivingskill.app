import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Image,
  Linking,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { UserProfile } from '../../services/api/userService';
import { triggerHaptic } from '../../utils/haptics';
import { MIN_TOUCH_TARGET } from '../../theme/typography';

export type SettingsTabId = 'general' | 'avatar' | 'cover' | 'password' | 'privacy';

interface ProfileSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  user: UserProfile | null;
  colors: any;
  isDark: boolean;
  isBangla: boolean;

  // General tab props
  firstName: string;
  setFirstName: (val: string) => void;
  lastName: string;
  setLastName: (val: string) => void;
  displayName: string;
  setDisplayName: (val: string) => void;
  userEmail: string;
  bioInfo: string;
  setBioInfo: (val: string) => void;
  phoneNumber: string;
  setPhoneNumber: (val: string) => void;
  socialFacebook: string;
  setSocialFacebook: (val: string) => void;
  socialTwitter: string;
  setSocialTwitter: (val: string) => void;
  socialYoutube: string;
  setSocialYoutube: (val: string) => void;
  socialLinkedin: string;
  setSocialLinkedin: (val: string) => void;
  handleSaveProfile: () => void;
  isSavingProfile: boolean;

  // Password tab props
  currentPass: string;
  setCurrentPass: (val: string) => void;
  newPass: string;
  setNewPass: (val: string) => void;
  confirmPass: string;
  setConfirmPass: (val: string) => void;
  showCurrentPass: boolean;
  setShowCurrentPass: (val: boolean) => void;
  showNewPass: boolean;
  setShowNewPass: (val: boolean) => void;
  showConfirmPass: boolean;
  setShowConfirmPass: (val: boolean) => void;
  handleChangePassword: () => void;
  isChangingPass: boolean;

  // Privacy tab props
  privacyPublic: boolean;
  setPrivacyPublic: (val: boolean) => void;
  privacyCourses: boolean;
  setPrivacyCourses: (val: boolean) => void;
  privacyCertificates: boolean;
  setPrivacyCertificates: (val: boolean) => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  visible,
  onClose,
  user,
  colors,
  isDark,
  isBangla,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  displayName,
  setDisplayName,
  userEmail,
  bioInfo,
  setBioInfo,
  phoneNumber,
  setPhoneNumber,
  socialFacebook,
  setSocialFacebook,
  socialTwitter,
  setSocialTwitter,
  socialYoutube,
  setSocialYoutube,
  socialLinkedin,
  setSocialLinkedin,
  handleSaveProfile,
  isSavingProfile,
  currentPass,
  setCurrentPass,
  newPass,
  setNewPass,
  confirmPass,
  setConfirmPass,
  showCurrentPass,
  setShowCurrentPass,
  showNewPass,
  setShowNewPass,
  showConfirmPass,
  setShowConfirmPass,
  handleChangePassword,
  isChangingPass,
  privacyPublic,
  setPrivacyPublic,
  privacyCourses,
  setPrivacyCourses,
  privacyCertificates,
  setPrivacyCertificates,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTabId>('general');
  const tabNewPassRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const tabConfirmPassRef = useRef<React.ElementRef<typeof TextInput>>(null);

  const tabs: { id: SettingsTabId; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'avatar', label: 'Avatar' },
    { id: 'cover', label: 'Cover Image' },
    { id: 'password', label: 'Password' },
    { id: 'privacy', label: 'Privacy' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        style={styles.modalBackdrop}
      >
        <View
          style={[
            styles.modalCard,
            { backgroundColor: colors.surfaceCard, borderColor: colors.border, maxHeight: '92%' },
          ]}
        >
          <View style={styles.modalHeader}>
            <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {isBangla ? 'প্রোফাইল সেটিংস' : 'Profile Settings'}
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                thrivingskill.com • {isBangla ? 'অফিসিয়াল অ্যাকাউন্ট কন্ট্রোল' : 'Official Account Settings'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.modalCloseBtn}
              accessibilityRole="button"
              accessibilityLabel="Close settings"
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Subtabs Bar: General | Avatar | Cover Image | Password | Privacy */}
          <View style={[styles.settingsTabBar, { borderBottomColor: colors.border }]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.settingsTabScroll}
            >
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={[
                      styles.settingsTabItem,
                      isActive && [styles.settingsTabItemActive, { borderBottomColor: colors.primary }],
                    ]}
                    onPress={() => {
                      triggerHaptic('selection');
                      setActiveTab(tab.id);
                    }}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text
                      style={[
                        styles.settingsTabText,
                        { color: isActive ? colors.primary : colors.textMuted },
                        isActive && { fontWeight: '700' },
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <ScrollView
            style={{ flexShrink: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {activeTab === 'general' && (
              <View style={{ paddingVertical: 10 }}>
                {/* First Name & Last Name */}
                <View style={styles.twoColRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>First name</Text>
                    <TextInput
                      style={[
                        styles.modalInput,
                        { backgroundColor: colors.surfaceSubtle, color: colors.text, borderColor: colors.border },
                      ]}
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholder="First name"
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="words"
                      accessibilityLabel="First name"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Last name</Text>
                    <TextInput
                      style={[
                        styles.modalInput,
                        { backgroundColor: colors.surfaceSubtle, color: colors.text, borderColor: colors.border },
                      ]}
                      value={lastName}
                      onChangeText={setLastName}
                      placeholder="Last name"
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="words"
                      accessibilityLabel="Last name"
                    />
                  </View>
                </View>

                {/* Display Name* & Email Address* */}
                <View style={[styles.twoColRow, { marginTop: 12 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>
                      Display name<Text style={{ color: colors.danger }}>*</Text>
                    </Text>
                    <TextInput
                      style={[
                        styles.modalInput,
                        { backgroundColor: colors.surfaceSubtle, color: colors.text, borderColor: colors.border },
                      ]}
                      value={displayName}
                      onChangeText={setDisplayName}
                      placeholder="Display name"
                      placeholderTextColor={colors.textMuted}
                      accessibilityLabel="Display name"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>
                      Email address<Text style={{ color: colors.danger }}>*</Text>
                    </Text>
                    <TextInput
                      style={[
                        styles.modalInput,
                        { backgroundColor: colors.surfaceSubtle, color: colors.text, borderColor: colors.border },
                      ]}
                      value={userEmail}
                      editable={false}
                      placeholder="Email address"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="email-address"
                      accessibilityLabel="Email address"
                    />
                  </View>
                </View>

                {/* Biographical Info */}
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Biographical Info</Text>
                  <TextInput
                    style={[
                      styles.modalInput,
                      {
                        backgroundColor: colors.surfaceSubtle,
                        color: colors.text,
                        borderColor: colors.border,
                        minHeight: 74,
                        textAlignVertical: 'top',
                      },
                    ]}
                    value={bioInfo}
                    onChangeText={setBioInfo}
                    placeholder="Share a little biographical information..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    accessibilityLabel="Biographical Info"
                  />
                  <Text style={[styles.helperText, { color: colors.textMuted }]}>
                    Share a little biographical information to fill out your profile. This may be shown publicly.
                  </Text>
                </View>

                {/* Phone Number */}
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Phone Number</Text>
                  <TextInput
                    style={[
                      styles.modalInput,
                      { backgroundColor: colors.surfaceSubtle, color: colors.text, borderColor: colors.border },
                    ]}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder="Phone Number"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                    accessibilityLabel="Phone Number"
                  />
                </View>

                {/* Social Links: Facebook & X Profile */}
                <View style={[styles.twoColRow, { marginTop: 12 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Facebook Profile</Text>
                    <TextInput
                      style={[
                        styles.modalInput,
                        { backgroundColor: colors.surfaceSubtle, color: colors.text, borderColor: colors.border },
                      ]}
                      value={socialFacebook}
                      onChangeText={setSocialFacebook}
                      placeholder="https://"
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="none"
                      accessibilityLabel="Facebook Profile URL"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>X Profile</Text>
                    <TextInput
                      style={[
                        styles.modalInput,
                        { backgroundColor: colors.surfaceSubtle, color: colors.text, borderColor: colors.border },
                      ]}
                      value={socialTwitter}
                      onChangeText={setSocialTwitter}
                      placeholder="https://"
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="none"
                      accessibilityLabel="X Profile URL"
                    />
                  </View>
                </View>

                {/* Social Links: Youtube Channel & Linkedin Profile */}
                <View style={[styles.twoColRow, { marginTop: 12 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Youtube Channel</Text>
                    <TextInput
                      style={[
                        styles.modalInput,
                        { backgroundColor: colors.surfaceSubtle, color: colors.text, borderColor: colors.border },
                      ]}
                      value={socialYoutube}
                      onChangeText={setSocialYoutube}
                      placeholder="https://"
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="none"
                      accessibilityLabel="Youtube Channel URL"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Linkedin Profile</Text>
                    <TextInput
                      style={[
                        styles.modalInput,
                        { backgroundColor: colors.surfaceSubtle, color: colors.text, borderColor: colors.border },
                      ]}
                      value={socialLinkedin}
                      onChangeText={setSocialLinkedin}
                      placeholder="https://"
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="none"
                      accessibilityLabel="Linkedin Profile URL"
                    />
                  </View>
                </View>

                {/* Save Changes CTA */}
                <TouchableOpacity
                  style={[styles.saveChangesBtn, { backgroundColor: isDark ? colors.primary : '#102F53' }]}
                  onPress={handleSaveProfile}
                  disabled={isSavingProfile}
                  activeOpacity={0.88}
                  accessibilityRole="button"
                  accessibilityLabel="Save profile changes"
                >
                  {isSavingProfile ? (
                    <ActivityIndicator size="small" color={isDark ? '#0F172A' : '#FFFFFF'} />
                  ) : (
                    <Text style={[styles.saveChangesBtnText, { color: isDark ? '#0F172A' : '#FFFFFF' }]}>
                      SAVE CHANGES
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {activeTab === 'avatar' && (
              <View style={{ paddingVertical: 18, alignItems: 'center' }}>
                <View style={[styles.avatarWrapBig, { borderColor: colors.primary }]}>
                  {user?.avatar ? (
                    <Image source={{ uri: user.avatar }} style={styles.avatarImgBig} />
                  ) : (
                    <Ionicons name="person" size={54} color={colors.primary} />
                  )}
                </View>
                <Text style={[styles.avatarNameBig, { color: colors.text }]}>
                  {displayName || 'Student Profile'}
                </Text>
                <Text style={[styles.avatarSubBig, { color: colors.textMuted }]}>
                  Your avatar is synchronized with Gravatar and your official Thriving Skills LMS profile.
                </Text>
                <TouchableOpacity
                  style={[
                    styles.secondaryActionBtn,
                    { borderColor: colors.primary, backgroundColor: colors.primaryLight },
                  ]}
                  onPress={() => Linking.openURL('https://gravatar.com').catch(() => {})}
                  accessibilityRole="button"
                  accessibilityLabel="Update avatar on Gravatar"
                >
                  <Ionicons name="image-outline" size={16} color={colors.primary} />
                  <Text style={[styles.secondaryActionText, { color: colors.primary }]}>
                    Update on Gravatar
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {activeTab === 'cover' && (
              <View style={{ paddingVertical: 18, alignItems: 'center' }}>
                <View style={[styles.coverPreviewCard, { backgroundColor: '#102F53' }]}>
                  <Ionicons name="school" size={42} color="#FFB606" />
                  <Text style={styles.coverCardTitle}>THRIVING SKILLS</Text>
                  <Text style={styles.coverCardSub}>Executive Learning & Career Advancement</Text>
                </View>
                <Text style={[styles.avatarSubBig, { color: colors.textMuted, marginTop: 14 }]}>
                  Cover photos appear across your public student profile and verified completion badges.
                </Text>
              </View>
            )}

            {activeTab === 'password' && (
              <View style={{ paddingVertical: 10 }}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Old Password</Text>
                <View
                  style={[
                    styles.passwordInputRow,
                    { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                  ]}
                >
                  <TextInput
                    style={[styles.passwordInputFlex, { color: colors.text }]}
                    value={currentPass}
                    onChangeText={setCurrentPass}
                    secureTextEntry={!showCurrentPass}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => tabNewPassRef.current?.focus()}
                    blurOnSubmit={false}
                    placeholder="Enter current password"
                    placeholderTextColor={colors.textMuted}
                    accessibilityLabel="Current password"
                  />
                  <TouchableOpacity
                    style={styles.eyeToggleBtn}
                    onPress={() => {
                      triggerHaptic('light');
                      setShowCurrentPass(!showCurrentPass);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={showCurrentPass ? 'Hide current password' : 'Show current password'}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={showCurrentPass ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.inputLabel, { color: colors.text, marginTop: 12 }]}>
                  New Password * (Min 12 Chars)
                </Text>
                <View
                  style={[
                    styles.passwordInputRow,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      borderColor: newPass.length > 0 && newPass.length < 12 ? colors.danger : colors.border,
                    },
                  ]}
                >
                  <TextInput
                    ref={tabNewPassRef}
                    style={[styles.passwordInputFlex, { color: colors.text }]}
                    value={newPass}
                    onChangeText={setNewPass}
                    secureTextEntry={!showNewPass}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="new-password"
                    textContentType="newPassword"
                    returnKeyType="next"
                    onSubmitEditing={() => tabConfirmPassRef.current?.focus()}
                    blurOnSubmit={false}
                    placeholder="Enter new password (min 12 chars)"
                    placeholderTextColor={colors.textMuted}
                    accessibilityLabel="New password"
                  />
                  <TouchableOpacity
                    style={styles.eyeToggleBtn}
                    onPress={() => {
                      triggerHaptic('light');
                      setShowNewPass(!showNewPass);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={showNewPass ? 'Hide new password' : 'Show new password'}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={showNewPass ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
                {/* Official Password Hint from thrivingskill.com / WordPress */}
                <View style={[styles.siteHintBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
                  <Ionicons name="information-circle" size={16} color={colors.primary} style={{ marginTop: 1 }} />
                  <Text style={[styles.siteHintText, { color: colors.textMuted }]}>
                    <Text style={{ fontWeight: '700', color: colors.text }}>Hint: </Text>
                    The password should be at least twelve characters long. To make it stronger, use upper and lower case letters, numbers, and symbols like ! " ? $ % ^ & ).
                  </Text>
                </View>

                <Text style={[styles.inputLabel, { color: colors.text, marginTop: 12 }]}>
                  Confirm New Password
                </Text>
                <View
                  style={[
                    styles.passwordInputRow,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      borderColor: confirmPass.length > 0 && confirmPass !== newPass ? colors.danger : colors.border,
                    },
                  ]}
                >
                  <TextInput
                    ref={tabConfirmPassRef}
                    style={[styles.passwordInputFlex, { color: colors.text }]}
                    value={confirmPass}
                    onChangeText={setConfirmPass}
                    secureTextEntry={!showConfirmPass}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    placeholder="Confirm new password"
                    placeholderTextColor={colors.textMuted}
                    accessibilityLabel="Confirm new password"
                  />
                  <TouchableOpacity
                    style={styles.eyeToggleBtn}
                    onPress={() => {
                      triggerHaptic('light');
                      setShowConfirmPass(!showConfirmPass);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={showConfirmPass ? 'Hide confirm password' : 'Show confirm password'}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={showConfirmPass ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[
                    styles.saveChangesBtn,
                    {
                      backgroundColor: isDark ? colors.primary : '#102F53',
                      marginTop: 18,
                    },
                  ]}
                  onPress={handleChangePassword}
                  disabled={isChangingPass}
                  activeOpacity={0.88}
                  accessibilityRole="button"
                  accessibilityLabel="Save password changes"
                >
                  {isChangingPass ? (
                    <ActivityIndicator size="small" color={isDark ? '#0F172A' : '#FFFFFF'} />
                  ) : (
                    <Text style={[styles.saveChangesBtnText, { color: isDark ? '#0F172A' : '#FFFFFF' }]}>
                      SAVE CHANGES
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {activeTab === 'privacy' && (
              <View style={{ paddingVertical: 12 }}>
                <View style={[styles.privacyRow, { borderBottomColor: colors.borderSubtle }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.privacyLabel, { color: colors.text }]}>Public Profile</Text>
                    <Text style={[styles.privacySub, { color: colors.textMuted }]}>
                      Allow fellow professionals and instructors to view your achievements.
                    </Text>
                  </View>
                  <Switch
                    value={privacyPublic}
                    onValueChange={setPrivacyPublic}
                    trackColor={{ false: '#CBD5E1', true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={[styles.privacyRow, { borderBottomColor: colors.borderSubtle }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.privacyLabel, { color: colors.text }]}>Show Enrolled Courses</Text>
                    <Text style={[styles.privacySub, { color: colors.textMuted }]}>
                      Display course progress on your profile.
                    </Text>
                  </View>
                  <Switch
                    value={privacyCourses}
                    onValueChange={setPrivacyCourses}
                    trackColor={{ false: '#CBD5E1', true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={styles.privacyRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.privacyLabel, { color: colors.text }]}>Show Certificates</Text>
                    <Text style={[styles.privacySub, { color: colors.textMuted }]}>
                      Display verified digital certificates on your public portfolio.
                    </Text>
                  </View>
                  <Switch
                    value={privacyCertificates}
                    onValueChange={setPrivacyCertificates}
                    trackColor={{ false: '#CBD5E1', true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
    maxHeight: '92%',
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
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  settingsTabBar: {
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  settingsTabScroll: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 4,
  },
  settingsTabItem: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  settingsTabItemActive: {
    borderBottomWidth: 2,
  },
  settingsTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  helperText: {
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
  },
  saveChangesBtn: {
    marginTop: 18,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#102F53',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  saveChangesBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  avatarWrapBig: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 10,
  },
  avatarImgBig: {
    width: '100%',
    height: '100%',
  },
  avatarNameBig: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  avatarSubBig: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 17,
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 14,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  coverPreviewCard: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  coverCardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 6,
  },
  coverCardSub: {
    color: '#FFB606',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  passwordInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  passwordInputFlex: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
  },
  eyeToggleBtn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  siteHintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginTop: 8,
    gap: 8,
  },
  siteHintText: {
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  privacyLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  privacySub: {
    fontSize: 12,
    lineHeight: 16,
  },
});
