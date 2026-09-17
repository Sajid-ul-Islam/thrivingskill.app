import React, { useState } from 'react';
import {
  View,
  Text,
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
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

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
    question: 'How do I pay using bKash, Nagad, or DBBL Rocket?',
    banglaQuestion: 'বিকাশ, নগদ বা রকেটের মাধ্যমে কীভাবে কোর্স ফি পেমেন্ট করব?',
    answer:
      'Select your course, tap "Enroll Now", and choose bKash, Nagad, or Rocket. Enter your mobile wallet account number. Once confirmed, your course will be instantly unlocked and synchronized with your account.',
    banglaAnswer:
      'কোর্স সিলেক্ট করে "এখনই ভর্তি হন" বাটনে চাপুন এবং বিকাশ, নগদ বা রকেট নির্বাচন করুন। আপনার মোবাইল ওয়ালেট নম্বর প্রদান করুন। পেমেন্ট কনফার্ম হওয়া মাত্রই কোর্সটি সঙ্গে সঙ্গে আনলক হয়ে যাবে।',
  },
  {
    id: 'pay-2',
    category: 'payment',
    question: 'Can I pay with credit/debit cards or international methods?',
    banglaQuestion: 'আমি কি ক্রেডিট/ডেবিট কার্ড বা বিদেশি পেমেন্ট মেথডে পেমেন্ট করতে পারব?',
    answer:
      'Yes! Choose the "Cards / NetBanking" option powered by SSLCommerz or Stripe to pay with Visa, Mastercard, AMEX, or international credit cards.',
    banglaAnswer:
      'হ্যাঁ! ভিসা, মাস্টারকার্ড, অ্যামেক্স অথবা আন্তর্জাতিক কার্ডের মাধ্যমে পেমেন্ট করতে "Cards / NetBanking" অপশনটি সিলেক্ট করুন।',
  },
  {
    id: 'pay-3',
    category: 'payment',
    question: 'Where can I find my invoice and transaction receipt?',
    banglaQuestion: 'আমার পেমেন্ট রসিদ এবং ইনভয়েস কোথায় পাব?',
    answer:
      'Go to the Profile tab and tap "Invoice" or "Payment History". You can download official PDF receipts containing your Transaction ID, date, and VAT breakdown.',
    banglaAnswer:
      'প্রোফাইল ট্যাবে গিয়ে "ইনভয়েস" বা "পেমেন্ট হিস্ট্রি"-তে ট্যাপ করুন। সেখান থেকে আপনার ট্রানজ্যাকশন আইডি ও তারিখসহ অফিসিয়াল পিডিএফ রসিদ ডাউনলোড করতে পারবেন।',
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
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const categories = [
    { id: 'all', label: isBangla ? 'সকল প্রশ্ন' : 'All Topics', icon: 'apps-outline' },
    { id: 'payment', label: isBangla ? 'পেমেন্ট ও রিফান্ড' : 'Payments', icon: 'card-outline' },
    { id: 'access', label: isBangla ? 'কোর্স অ্যাক্সেস' : 'Enrollment', icon: 'book-outline' },
    { id: 'video', label: isBangla ? 'ভিডিও ও প্লেয়ার' : 'Video & Audio', icon: 'play-circle-outline' },
    { id: 'certificate', label: isBangla ? 'সার্টিফিকেট' : 'Certificates', icon: 'ribbon-outline' },
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
              onPress={onClose}
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
              placeholder={isBangla ? 'প্রশ্ন খুঁজুন (যেমন: বিকাশ, সার্টিফিকেট)...' : 'Search FAQ (e.g. bKash, certificate)...'}
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
                    color={active ? '#FFFFFF' : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.catPillText,
                      { color: active ? '#FFFFFF' : colors.text, fontWeight: active ? '700' : '500' },
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
                <Ionicons name="call" size={16} color="#FFFFFF" />
                <Text style={styles.contactBtnText}>01312100288</Text>
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
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
