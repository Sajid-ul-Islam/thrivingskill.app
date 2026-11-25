import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { triggerHaptic } from '../../../utils/haptics';
import { paymentModalStyles as styles } from './paymentModal.styles';

interface BillingDetailsFormProps {
  colors: any;
  isBangla: boolean;
  isAuthenticated: boolean;
  user: any;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  address: string;
  email: string;
  orderNotes: string;
  formErrors: Record<string, string>;
  isEditingDetails: boolean;
  lastNameRef: React.RefObject<React.ElementRef<typeof TextInput> | null>;
  phoneRef: React.RefObject<React.ElementRef<typeof TextInput> | null>;
  cityRef: React.RefObject<React.ElementRef<typeof TextInput> | null>;
  addressRef: React.RefObject<React.ElementRef<typeof TextInput> | null>;
  emailRef: React.RefObject<React.ElementRef<typeof TextInput> | null>;
  orderNotesRef: React.RefObject<React.ElementRef<typeof TextInput> | null>;
  setFirstName: (v: string) => void;
  setLastName: (v: string) => void;
  setPhone: (v: string) => void;
  setCity: (v: string) => void;
  setAddress: (v: string) => void;
  setEmail: (v: string) => void;
  setOrderNotes: (v: string) => void;
  setIsEditingDetails: (v: boolean) => void;
  clearError: (field: string) => void;
}

export const BillingDetailsForm: React.FC<BillingDetailsFormProps> = ({
  colors,
  isBangla,
  isAuthenticated,
  user,
  firstName,
  lastName,
  phone,
  city,
  address,
  email,
  orderNotes,
  formErrors,
  isEditingDetails,
  lastNameRef,
  phoneRef,
  cityRef,
  addressRef,
  emailRef,
  orderNotesRef,
  setFirstName,
  setLastName,
  setPhone,
  setCity,
  setAddress,
  setEmail,
  setOrderNotes,
  setIsEditingDetails,
  clearError,
}) => (
  <View
    style={[
      styles.learnerSummaryCard,
      { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
    ]}
  >
    <View style={styles.learnerHeaderRow}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
        <View style={[styles.learnerAvatarIcon, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="person" size={16} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.learnerTitle, { color: colors.text }]} numberOfLines={1}>
            {isAuthenticated
              ? `${firstName} ${lastName}`.trim() || user?.displayName || user?.username
              : isBangla
                ? 'অতিথি শিক্ষার্থী'
                : 'Guest Learner'}
          </Text>
          <Text style={[styles.learnerSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
            {email || (isBangla ? 'ইমেল তথ্য প্রয়োজন' : 'Email required')} {phone ? `• ${phone}` : ''}{' '}
            {city ? `• ${city}` : ''}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.editDetailsBtn, { borderColor: colors.border }]}
        onPress={() => {
          triggerHaptic('selection');
          setIsEditingDetails(!isEditingDetails);
        }}
        accessibilityRole="button"
        accessibilityLabel="Edit billing details"
      >
        <Ionicons
          name={isEditingDetails ? 'checkmark-outline' : 'pencil-outline'}
          size={14}
          color={colors.primary}
          style={{ marginRight: 4 }}
        />
        <Text style={[styles.editDetailsBtnText, { color: colors.primary }]}>
          {isEditingDetails ? (isBangla ? 'ঠিক আছে' : 'Done') : isBangla ? 'পরিবর্তন' : 'Edit'}
        </Text>
      </TouchableOpacity>
    </View>

    {isEditingDetails && (
      <View style={styles.expandedFieldsContainer}>
        <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 10 }]} />

        <View style={styles.nameRow}>
          <View style={styles.nameCol}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              {isBangla ? 'নামের প্রথম অংশ' : 'First name'}{' '}
              <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: formErrors.firstName ? '#DC2626' : colors.border,
                  color: colors.text,
                },
              ]}
              value={firstName}
              onChangeText={(txt) => {
                setFirstName(txt);
                clearError('firstName');
              }}
              placeholder="e.g. Tanvir"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              autoComplete="name-given"
              textContentType="givenName"
              returnKeyType="next"
              onSubmitEditing={() => lastNameRef.current?.focus()}
              blurOnSubmit={false}
              accessibilityLabel={isBangla ? 'নামের প্রথম অংশ' : 'First name'}
            />
          </View>

          <View style={styles.nameCol}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              {isBangla ? 'নামের শেষ অংশ' : 'Last name'}{' '}
              <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <TextInput
              ref={lastNameRef}
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: formErrors.lastName ? '#DC2626' : colors.border,
                  color: colors.text,
                },
              ]}
              value={lastName}
              onChangeText={(txt) => {
                setLastName(txt);
                clearError('lastName');
              }}
              placeholder="e.g. Ahmed"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              autoComplete="name-family"
              textContentType="familyName"
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
              blurOnSubmit={false}
              accessibilityLabel={isBangla ? 'নামের শেষ অংশ' : 'Last name'}
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            {isBangla
              ? 'ফোন নম্বর (পেমেন্ট ও এসএমএস নোটিফিকেশন)'
              : 'Phone (Payment & SMS confirmation)'}{' '}
            <Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <TextInput
            ref={phoneRef}
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: formErrors.phone ? '#DC2626' : colors.border,
                color: colors.text,
              },
            ]}
            value={phone}
            onChangeText={(txt) => {
              setPhone(txt);
              clearError('phone');
            }}
            placeholder="017XXXXXXXX"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            returnKeyType="next"
            onSubmitEditing={() => cityRef.current?.focus()}
            blurOnSubmit={false}
            accessibilityLabel={isBangla ? 'ফোন নম্বর' : 'Phone number'}
          />
        </View>

        <View style={styles.nameRow}>
          <View style={styles.nameCol}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              {isBangla ? 'জেলা / শহর' : 'Town / City'}
            </Text>
            <TextInput
              ref={cityRef}
              style={[
                styles.input,
                { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
              ]}
              value={city}
              onChangeText={setCity}
              placeholder="e.g. Dhaka"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              autoComplete="postal-address-locality"
              textContentType="addressCity"
              returnKeyType="next"
              onSubmitEditing={() => addressRef.current?.focus()}
              blurOnSubmit={false}
              accessibilityLabel={isBangla ? 'জেলা বা শহর' : 'City or Town'}
            />
          </View>

          <View style={styles.nameCol}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              {isBangla ? 'ঠিকানা (ঐচ্ছিক)' : 'Street Address'}
            </Text>
            <TextInput
              ref={addressRef}
              style={[
                styles.input,
                { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
              ]}
              value={address}
              onChangeText={setAddress}
              placeholder="e.g. Dhanmondi, Rd 27"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              autoComplete="street-address"
              textContentType="fullStreetAddress"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              blurOnSubmit={false}
              accessibilityLabel={isBangla ? 'ঠিকানা' : 'Street Address'}
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            {isBangla ? 'ইমেল ঠিকানা' : 'Email address'}{' '}
            <Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <TextInput
            ref={emailRef}
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: formErrors.email ? '#DC2626' : colors.border,
                color: colors.text,
              },
            ]}
            value={email}
            onChangeText={(txt) => {
              setEmail(txt);
              clearError('email');
            }}
            placeholder="name@example.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            onSubmitEditing={() => orderNotesRef.current?.focus()}
            blurOnSubmit={false}
            accessibilityLabel={isBangla ? 'ইমেল ঠিকানা' : 'Email address'}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            {isBangla ? 'অতিরিক্ত তথ্য (ঐচ্ছিক)' : 'Order Notes (optional)'}
          </Text>
          <TextInput
            ref={orderNotesRef}
            style={[
              styles.input,
              styles.textArea,
              { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
            ]}
            value={orderNotes}
            onChangeText={setOrderNotes}
            placeholder={
              isBangla
                ? 'কোর্স সংক্রান্ত কোনো বিশেষ নির্দেশনা থাকলে লিখুন...'
                : 'Notes about your order, e.g. special requests'
            }
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={2}
            returnKeyType="done"
            accessibilityLabel={isBangla ? 'অতিরিক্ত তথ্য' : 'Order Notes'}
          />
        </View>
      </View>
    )}
  </View>
);
