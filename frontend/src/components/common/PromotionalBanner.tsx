import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Tag, Sparkles, Percent } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../../config/theme';
import type { Promotion } from '../../models/types';

interface PromotionalBannerProps {
  promotions: Promotion[];
  onSelectPromotion?: (promo: Promotion) => void;
}

export const PromotionalBanner: React.FC<PromotionalBannerProps> = ({
  promotions,
  onSelectPromotion,
}) => {
  if (!promotions || promotions.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <Sparkles size={16} color={colors.accentOrange} />
          <Text style={styles.sectionTitle}>TODAY'S DISCOUNTS & OFFERS</Text>
        </View>
        <Text style={styles.counterText}>{promotions.length} Active</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {promotions.map((promo, index) => {
          // Alternate accent backgrounds for playful look
          const bgColors = [colors.primary, '#845EC2', colors.accentOrange, '#2C73D2'];
          const cardBg = bgColors[index % bgColors.length];

          return (
            <TouchableOpacity
              key={promo.promotion_id}
              style={[styles.card, { backgroundColor: cardBg }]}
              activeOpacity={0.85}
              onPress={() => onSelectPromotion && onSelectPromotion(promo)}
            >
              <View style={styles.topRow}>
                <View style={styles.tagBadge}>
                  <Tag size={10} color={cardBg} />
                  <Text style={[styles.tagText, { color: cardBg }]}>
                    {promo.tag}
                  </Text>
                </View>
                <View style={styles.percentBadge}>
                  <Percent size={11} color="#FFFFFF" />
                  <Text style={styles.percentText}>{promo.discount_percent}% OFF</Text>
                </View>
              </View>

              <Text style={styles.cardTitle} numberOfLines={2}>
                {promo.title}
              </Text>

              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {promo.subtitle}
              </Text>

              <View style={styles.codeRow}>
                <Text style={styles.useCodeLabel}>Code:</Text>
                <View style={styles.codePill}>
                  <Text style={styles.codeText}>{promo.discount_code}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: typography.fontWeights.heavy,
    color: colors.textSecondary,
    letterSpacing: 0.6,
  },
  counterText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  card: {
    width: 250,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  tagText: {
    fontSize: 9,
    fontWeight: typography.fontWeights.heavy,
  },
  percentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    gap: 2,
  },
  percentText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: typography.fontWeights.bold,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: typography.fontWeights.heavy,
    color: '#FFFFFF',
    marginVertical: 4,
    lineHeight: 19,
  },
  cardSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.88)',
    fontWeight: typography.fontWeights.medium,
    marginBottom: spacing.sm,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  useCodeLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: typography.fontWeights.semibold,
  },
  codePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderStyle: 'dashed',
  },
  codeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: typography.fontWeights.heavy,
    letterSpacing: 0.5,
  },
});

