import React from 'react';
import { View, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Course } from '../../../types';
import { shape } from '../../../theme/shapes';
import { paymentModalStyles as styles } from './paymentModal.styles';

interface OrderSummaryCardProps {
  course: Course;
  colors: any;
  isDark: boolean;
  isBangla: boolean;
  isBundle: boolean;
  subCourses: { id: string; title: string; priceBdt?: number }[];
  discountPercent: number;
  formattedPrice: string;
  formattedSubtotal: string;
  formattedDiscount: string;
}

export const OrderSummaryCard: React.FC<OrderSummaryCardProps> = ({
  course,
  colors,
  isDark,
  isBangla,
  isBundle,
  subCourses,
  discountPercent,
  formattedPrice,
  formattedSubtotal,
  formattedDiscount,
}) => (
  <View
    style={[
      styles.orderSummaryCard,
      { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
    ]}
  >
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
      }}
    >
      <Text style={[styles.orderSummaryTitle, { color: colors.text, marginBottom: 0 }]}>
        {isBangla ? 'আপনার অর্ডার' : 'Your order'}
      </Text>
      {isBundle && (
        <View
          style={{
            backgroundColor: '#102F53',
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: shape.full,
          }}
        >
          <Text style={{ color: '#E34234', fontSize: 10, fontWeight: '800' }}>
            {isBangla
              ? `স্পেশাল বান্ডেল (${subCourses.length}টি কোর্স)`
              : `SPECIAL BUNDLE (${subCourses.length} COURSES)`}
          </Text>
        </View>
      )}
    </View>

    <View style={styles.orderItemRow}>
      <Text style={[styles.orderItemName, { color: colors.text }]} numberOfLines={2}>
        {course.title} × 1
      </Text>
      <Text style={[styles.orderItemPrice, { color: colors.text }]}>{formattedPrice}</Text>
    </View>

    {isBundle && subCourses.length > 0 && (
      <View
        style={{
          marginVertical: 8,
          padding: 10,
          backgroundColor: colors.surfaceSubtle,
          borderRadius: shape.medium,
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text, marginBottom: 6 }}>
          {isBangla
            ? `বান্ডেলে অন্তর্ভুক্ত ${subCourses.length}টি কোর্স:`
            : `Included ${subCourses.length} courses in this bundle:`}
        </Text>
        {subCourses.map((sub, idx) => (
          <View
            key={sub.id}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 2.5 }}
          >
            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
            <Text style={{ fontSize: 11, color: colors.text, flex: 1 }} numberOfLines={1}>
              {idx + 1}. {sub.title}
            </Text>
            {typeof sub.priceBdt === 'number' && sub.priceBdt > 0 && (
              <Text
                style={{
                  fontSize: 10,
                  color: colors.textMuted,
                  textDecorationLine: 'line-through',
                }}
              >
                ৳{sub.priceBdt}
              </Text>
            )}
          </View>
        ))}
        {discountPercent > 0 && (
          <View
            style={{
              marginTop: 6,
              paddingTop: 4,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#10B981' }}>
              {isBangla
                ? `বান্ডেল ছাড় (${discountPercent}% OFF)`
                : `Bundle Discount Applied (-${discountPercent}%)`}
            </Text>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#10B981' }}>
              {formattedDiscount}
            </Text>
          </View>
        )}
      </View>
    )}

    <View style={[styles.divider, { backgroundColor: colors.border }]} />

    <View style={styles.orderSummaryRow}>
      <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
        {isBangla ? 'সাবটোটাল' : 'Subtotal'}
      </Text>
      <Text style={[styles.summaryValue, { color: colors.text }]}>
        {isBundle ? formattedSubtotal : formattedPrice}
      </Text>
    </View>

    {isBundle && (
      <View style={styles.orderSummaryRow}>
        <Text style={[styles.summaryLabel, { color: '#10B981' }]}>
          {isBangla ? 'বান্ডেল ছাড়' : 'Bundle Discount'}
        </Text>
        <Text style={[styles.summaryValue, { color: '#10B981' }]}>{formattedDiscount}</Text>
      </View>
    )}

    <View style={styles.orderSummaryRow}>
      <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
        {isBangla ? 'ডেলিভারি ফি' : 'Delivery Fee'}
      </Text>
      <Text style={[styles.summaryValue, { color: colors.textMuted }]}>
        ৳ 0 ({isBangla ? 'ডিজিটাল কন্টেন্ট' : 'Digital Content'})
      </Text>
    </View>

    <View style={styles.orderSummaryRow}>
      <Text style={[styles.totalLabel, { color: colors.text }]}>
        {isBangla ? 'সর্বমোট' : 'Total'}
      </Text>
      <Text style={[styles.totalValue, { color: colors.primary }]}>{formattedPrice}</Text>
    </View>
  </View>
);
