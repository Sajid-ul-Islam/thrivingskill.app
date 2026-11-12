import React, { useState } from 'react';
import {
  View,
  Text,
  LayoutAnimation,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { triggerHaptic } from '../../utils/haptics';
import { typography, MIN_TOUCH_TARGET } from '../../theme/typography';
import { shape } from '../../theme/shapes';

export interface HelpFaqModalProps {
  visible: boolean;
  onClose: () => void;
}

interface FaqItem {
  id: string;
  category: 'payment' | 'access' | 'video' | 'certificate' | 'account' | 'tech';
  question: string;
  banglaQuestion: string;
  answer: string;
  banglaAnswer: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    id: 'pay-1',
    category: 'payment',
    question: 'How do I access my enrolled courses inside the mobile app?',
    banglaQuestion: 'মোবাইল অ্যাপে আমার এনরোল করা কোর্সগুলো কীভাবে দেখব?',
    answer:
      'Sign in using your Thriving Skills account from the Profile tab or top menu. Once signed in, your enrolled courses and learning progress synchronize automatically in the My Learning hub.',
    banglaAnswer:
      'প্রোফাইল ট্যাব বা উপরের মেনু থেকে আপনার থ্রাইভিং স্কিলস অ্যাকাউন্ট দিয়ে সাইন ইন করুন। সাইন ইন করার পর আপনার এনরোল করা সকল কোর্স এবং অগ্রগতি স্বয়ংক্রিয়ভাবে অ্যাপে সিঙ্ক হয়ে যাবে।',
  },
  {
    id: 'pay-2',
    category: 'payment',
    question: 'What should I do if an enrolled course still shows as locked?',
    banglaQuestion: 'এনরোল করা কোর্স লক দেখালে কী করব?',
    answer:
      'Verify you are signed in with the exact account email or username associated with your enrollment, then tap "Sync Access" on the course page to refresh your LearnPress status.',
    banglaAnswer:
      'আপনার এনরোলমেন্ট থাকা সঠিক ইমেইল বা ইউজারনেম দিয়ে সাইন ইন করেছেন কিনা নিশ্চিত হয়ে কোর্স পেজে "অ্যাক্সেস সিঙ্ক করুন" বাটনে চাপুন।',
  },
  {
    id: 'pay-3',
    category: 'payment',
    question: 'Where can I view my active course enrollments?',
    banglaQuestion: 'আমার এনরোল করা কোর্সের তালিকা কোথায় দেখব?',
    answer:
      'Open the "My Learning" tab for active courses or open Profile → Enrollment Records to inspect all synced courses on your account.',
    banglaAnswer:
      'আপনার সকল সক্রিয় কোর্স দেখতে "আমার কোর্স" ট্যাবে যান অথবা প্রোফাইল → এনরোলমেন্ট রেকর্ড থেকে আপনার সিঙ্ক করা কোর্সের তালিকা দেখুন।',
  },
  {
    id: 'acc-1',
    category: 'access',
    question: 'Is my course progress synchronized between website and mobile app?',
    banglaQuestion: 'ওয়েবসাইট এবং মোবাইল অ্যাপে কি আমার লার্নিং প্রোগ্রেস সিঙ্ক থাকবে?',
    answer:
      'Yes, 100%! Thriving Skills uses a centralized LearnPress backend. Your course enrollments, watched lessons, notes, and quiz results remain fully synchronized across thrivingskill.com and the mobile app.',
    banglaAnswer:
      'হ্যাঁ, ১০০%! আপনার অ্যাকাউন্ট, এনরোলমেন্ট, দেখা লেসন এবং কুইজের স্কোর ওয়েবসাইট (thrivingskill.com) এবং মোবাইল অ্যাপের মধ্যে রিয়েল-টাইমে সিঙ্ক থাকবে।',
  },
  {
    id: 'acc-2',
    category: 'access',
    question: 'How long do I have access to my purchased courses?',
    banglaQuestion: 'কোর্সের অ্যাক্সেস কতদিন পর্যন্ত থাকবে?',
    answer:
      'All enrolled courses come with Lifetime Access. You can revisit lectures, downloaded materials, and quizzes anytime from both Android and iOS.',
    banglaAnswer:
      'সকল কোর্সে রয়েছে লাইফটাইম (আজীবন) অ্যাক্সেস। যেকোনো সময় মোবাইল বা কম্পিউটার থেকে পুনরায় লেসন দেখতে পারবেন।',
  },
  {
    id: 'vid-1',
    category: 'video',
    question: 'How can I save lessons for offline studying?',
    banglaQuestion: 'ইন্টারনেট ছাড়া লেসন দেখার জন্য কীভাবে ডাউনলোড করব?',
    answer:
      'Inside the Lesson Player, tap the "Download" icon. The lecture resources and materials will be cached securely on your phone for offline study when traveling.',
    banglaAnswer:
      'লেসন প্লেয়ারের ভেতরে "ডাউনলোড" আইকনে ট্যাপ করুন। ইন্টারনেট না থাকলেও আপনার ফোনে লেসন ও স্টাডি রিসোর্স দেখতে পারবেন।',
  },
  {
    id: 'vid-2',
    category: 'video',
    question: 'Can I listen to lectures in audio-only mode during commute?',
    banglaQuestion: 'অফিস যাতায়াতের সময় কেবল অডিও মোডে কি লেকচার শোনা যাবে?',
    answer:
      'Yes! In the Lesson Player, toggle "Commute Audio" at the top. This saves mobile data and lets you learn hands-free on the road or in Dhaka traffic.',
    banglaAnswer:
      'অবশ্যই! লেসন প্লেয়ারের শীর্ষে "Commute Audio" মোড চালু করুন। এটি ইন্টারনেট ডাটা সাশ্রয় করে এবং যাতায়াতের সময় সহজে শেখার সুযোগ দেয়।',
  },
  {
    id: 'cert-1',
    category: 'certificate',
    question: 'How do I get my verified digital certificate?',
    banglaQuestion: 'কোর্স শেষ করার পর কীভাবে সার্টিফিকেট ডাউনলোড করব?',
    answer:
      'Once you complete 100% of the lessons and pass the final quiz, your official Certificate is instantly generated with a unique verification QR code and Credential ID.',
    banglaAnswer:
      'সকল লেসন সম্পন্ন করে কুইজে পাস করলেই একটি ইউনিক ভেরিফিকেশন কিউআর কোড ও ক্রেডেনশিয়াল আইডি সহ সার্টিফিকেট তৈরি হয়ে যাবে।',
  },
  {
    id: 'cert-2',
    category: 'certificate',
    question: 'Can I add my Thriving Skills certificate directly to LinkedIn?',
    banglaQuestion: 'সার্টিফিকেট কি সরাসরি লিংকডইন (LinkedIn) প্রোফাইলে যোগ করা যায়?',
    answer:
      'Yes! In the Certificate preview modal, tap "Add to LinkedIn". It pre-fills your course title, issuing organization, and verification URL directly into your LinkedIn Certifications.',
    banglaAnswer:
      'হ্যাঁ! সার্টিফিকেট ভিউয়ার থেকে "Add to LinkedIn" বাটনে চাপলে সরাসরি আপনার লিংকডইন প্রোফাইলে ভেরিফাইড ক্রেডেনশিয়াল যুক্ত হবে।',
  },
  {
    id: 'account-del-1',
    category: 'account',
    question: 'How do I request account and data deletion (Google Play Data Safety)?',
    banglaQuestion: 'কীভাবে আমার অ্যাকাউন্ট ও সকল ব্যক্তিগত তথ্য মুছে ফেলার অনুরোধ করব?',
    answer:
      'In compliance with Google Play User Data policies, any registered user can request permanent deletion of their account and all associated data at any time. You can request deletion directly in the app via Profile → Account Settings → Delete Account & Data, or submit an online request directly at https://thrivingskill.com/delete-account/ without having the app installed.',
    banglaAnswer:
      'গুগল প্লে স্টোরের পলিসি অনুযায়ী, যেকোনো নিবন্ধিত শিক্ষার্থী অ্যাপের Profile → Account Settings → Delete Account থেকে অথবা সরাসরি https://thrivingskill.com/delete-account/ লিংকে গিয়ে তাদের অ্যাকাউন্ট ও সকল ব্যক্তিগত তথ্য মুছে ফেলার অনুরোধ জমা দিতে পারেন।',
  },
  {
    id: 'tech-1',
    category: 'tech',
    question: 'Who can I contact if I encounter any technical issue?',
    banglaQuestion: 'কোনো টেকনিক্যাল সমস্যা হলে কার সাথে যোগাযোগ করব?',
    answer:
      'You can call our Executive Hotline at 01312100288, chat directly via WhatsApp (+8801312100288), or email info@thrivingskill.com. Our support team is available 7 days a week.',
    banglaAnswer:
      'আমাদের হেল্পলাইন নম্বরে (01312100288) কল করতে পারেন, অথবা সরাসরি হোয়াটসঅ্যাপে (+8801312100288) মেসেজ দিতে পারেন। আমাদের সাপোর্ট টিম সপ্তাহে ৭ দিনই সক্রিয় থাকে।',
  },
];

export const HelpFaqModal: React.FC<HelpFaqModalProps> = ({ visible, onClose }) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({ 'pay-1': true });

  if (!visible) return null;

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const categories = [
    { id: 'all', label: isBangla ? 'সকল প্রশ্ন' : 'All Topics', icon: 'apps-outline' },
    { id: 'payment', label: isBangla ? 'পেমেন্ট ও রিফান্ড' : 'Payments', icon: 'card-outline' },
    { id: 'access', label: isBangla ? 'কোর্স অ্যাক্সেস' : 'Enrollment', icon: 'book-outline' },
    { id: 'video', label: isBangla ? 'ভিডিও ও প্লেয়ার' : 'Video & Audio', icon: 'play-circle-outline' },
    { id: 'certificate', label: isBangla ? 'সার্টিফিকেট' : 'Certificates', icon: 'ribbon-outline' },
    { id: 'account', label: isBangla ? 'অ্যাকাউন্ট ও নিরাপত্তা' : 'Account & Safety', icon: 'shield-checkmark-outline' },
    { id: 'tech', label: isBangla ? 'টেকনিক্যাল সাপোর্ট' : 'Support', icon: 'headset-outline' },
  ];

  const filteredFaqs = FAQ_DATA.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      item.question.toLowerCase().includes(query) ||
      item.answer.toLowerCase().includes(query) ||
      item.banglaQuestion.includes(query) ||
      item.banglaAnswer.includes(query);
    return matchesCategory && matchesSearch;
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
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
          <View style={styles.headerRow}>
            <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="help-buoy" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {isBangla ? 'হেল্প ও এফএকিউ সেন্টার' : 'Help & FAQ Center'}
              </Text>
              <Text style={[styles.headerSub, { color: colors.textMuted }]}>
                {isBangla ? 'আপনার সকল প্রশ্নের দ্রুত সমাধান' : 'Frequently Asked Questions & Support'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
              onPress={() => {
                triggerHaptic('light');
                onClose();
              }}
              accessibilityRole="button"
              accessibilityLabel="Close Help and FAQ Center"
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View
            style={[
              styles.searchBar,
              { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
            ]}
          >
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={isBangla ? 'প্রশ্ন খুঁজুন (যেমন: এনরোলমেন্ট, সার্টিফিকেট)...' : 'Search FAQ (e.g. sync, certificate)...'}
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Category Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {categories.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.catPill,
                    {
                      backgroundColor: active ? colors.primary : colors.surfaceSubtle,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={14}
                    color={active ? colors.onPrimary : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.catPillText,
                      { color: active ? colors.onPrimary : colors.text, fontWeight: active ? '700' : '500' },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* FAQ Accordion List */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {filteredFaqs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={44} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                {isBangla ? 'কোনো ফলাফল পাওয়া যায়নি' : 'No matching questions found'}
              </Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                {isBangla ? 'আমাদের সরাসরি হটলাইনে যোগাযোগ করুন।' : 'Contact our live support team directly.'}
              </Text>
            </View>
          ) : (
            filteredFaqs.map((faq) => {
              const isExpanded = !!expandedIds[faq.id];
              return (
                <View
                  key={faq.id}
                  style={[
                    styles.faqCard,
                    { backgroundColor: colors.surfaceCard, borderColor: colors.border },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.faqHeader}
                    onPress={() => toggleExpand(faq.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.faqQuestion, { color: colors.text }]}>
                      {isBangla ? faq.banglaQuestion : faq.question}
                    </Text>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={colors.primary}
                    />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={[styles.faqBody, { borderTopColor: colors.borderSubtle }]}>
                      <Text style={[styles.faqAnswer, { color: colors.textMuted }]}>
                        {isBangla ? faq.banglaAnswer : faq.answer}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })
          )}

          {/* Quick Contact Desk */}
          <View
            style={[
              styles.contactBox,
              { backgroundColor: colors.surfaceCard, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.contactTitle, { color: colors.text }]}>
              {isBangla ? 'আরো সাহায্য প্রয়োজন?' : 'Still have questions?'}
            </Text>
            <Text style={[styles.contactSub, { color: colors.textMuted }]}>
              {isBangla
                ? 'আমাদের এডভাইজারদের সাথে সরাসরি কথা বলুন।'
                : 'Connect with a Thriving Skills student advisor instantly.'}
            </Text>

            <View style={styles.contactRow}>
              <TouchableOpacity
                style={[styles.contactBtn, { backgroundColor: '#25D366' }]}
                onPress={() => Linking.openURL('https://wa.me/8801312100288')}
              >
                <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
                <Text style={styles.contactBtnText}>WhatsApp Chat</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.contactBtn, { backgroundColor: colors.primary }]}
                onPress={() => Linking.openURL('tel:01312100288')}
              >
                <Ionicons name="call" size={16} color={colors.onPrimary} />
                <Text style={[styles.contactBtnText, { color: colors.onPrimary }]}>01312100288</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconWrap: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: shape.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h4,
  },
  headerSub: {
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    marginLeft: 8,
  },
  categoryScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 5,
  },
  catPillText: {
    fontSize: 11,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  faqCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  faqQuestion: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    paddingRight: 10,
    lineHeight: 18,
  },
  faqBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  faqAnswer: {
    fontSize: 12,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    marginTop: 4,
  },
  contactBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginTop: 14,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  contactSub: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 14,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 12,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
  },
  contactBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
