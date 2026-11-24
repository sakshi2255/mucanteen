import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Tag, Sparkles, Percent } from 'lucide-react-native';
import { colors } from '../../config/theme';
import { styles } from '../../styles/comman/PromotionalBannerStyles';
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


