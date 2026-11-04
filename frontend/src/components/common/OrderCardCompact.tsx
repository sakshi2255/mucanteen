import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock, Zap, CheckCircle2, XCircle, ArrowRight, Banknote, Timer, AlertCircle } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../config/theme';
import { StatusBadge } from './StatusBadge';
import type { Order } from '../../models/types';

interface OrderCardCompactProps {
  order: Order;
  isOperatorView?: boolean;
  onAccept?: (order: Order) => void;
  onDecline?: (order: Order) => void;
  onMarkCashReceived?: (order: Order) => void;
  onMarkReady?: (order: Order) => void;
  onMarkCollected?: (order: Order) => void;
  onPressTrack?: (order: Order) => void;
  style?: object;
}

export const OrderCardCompact: React.FC<OrderCardCompactProps> = ({
  order,
  isOperatorView = false,
  onAccept,
  onDecline,
  onMarkCashReceived,
  onMarkReady,
  onMarkCollected,
  onPressTrack,
  style,
}) => {
  const isPreorder = order.order_type === 'preorder';
  const tokenDisplay = order.token_display || `${order.token_prefix || 'A'}${order.daily_token_number}`;

  // Countdown timer for 12-minute ready window
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    if (order.order_status !== 'ready_for_pickup' || !order.collection_deadline) {
      return;
    }

    const updateTimer = () => {
      const deadline = new Date(order.collection_deadline!).getTime();
      const now = Date.now();
      const diffMs = deadline - now;

      if (diffMs <= 0) {
        setTimeLeftStr('Window Expired (12m)');
        setIsExpired(true);
      } else {
        const totalSecs = Math.floor(diffMs / 1000);
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        setTimeLeftStr(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} min`);
        setIsExpired(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [order.order_status, order.collection_deadline]);

  // Format order items summary string
  const itemsSummary = order.items_snapshot
    .map((item) => `${item.quantity}x ${item.item_name}`)
    .join(', ');

  return (
    <View style={[styles.card, style]}>
      {/* Top Bar: Prefixed Token, Order Type, Status */}
      <View style={styles.topBar}>
        <View style={styles.tokenContainer}>
          <View style={styles.tokenBadge}>
            <Text style={styles.tokenText}>{tokenDisplay}</Text>
          </View>
          <View style={{ marginLeft: spacing.sm }}>
            <View style={styles.typeRow}>
              {isPreorder ? (
                <View style={styles.preorderPill}>
                  <Clock size={11} color="#B45309" />
                  <Text style={styles.preorderPillText}>PREORDER ({order.pickup_time})</Text>
                </View>
              ) : (
                <View style={styles.instantPill}>
                  <Zap size={11} color={colors.primaryDark} />
                  <Text style={styles.instantPillText}>INSTANT</Text>
                </View>
              )}
            </View>
            <Text style={styles.orderIdText}>ID: {order.order_id.slice(-6).toUpperCase()}</Text>
          </View>
        </View>

        <StatusBadge status={order.order_status} />
      </View>

      {/* Payment Status Pill */}
      <View style={styles.paymentRow}>
        {order.payment_status === 'PAID_ONLINE_DEMO' ? (
          <View style={[styles.paymentBadge, styles.paidBadge]}>
            <CheckCircle2 size={11} color={colors.accentGreen} />
            <Text style={[styles.paymentText, { color: colors.accentGreen }]}>Paid Online (Demo)</Text>
          </View>
        ) : order.payment_status === 'CASH_RECEIVED' ? (
          <View style={[styles.paymentBadge, styles.paidBadge]}>
            <CheckCircle2 size={11} color={colors.accentGreen} />
            <Text style={[styles.paymentText, { color: colors.accentGreen }]}>Cash Received</Text>
          </View>
        ) : (
          <View style={[styles.paymentBadge, styles.cashPendingBadge]}>
            <Banknote size={11} color="#B45309" />
            <Text style={[styles.paymentText, { color: '#B45309' }]}>Cash Due at Counter</Text>
          </View>
        )}
      </View>

      {/* 12-Minute Countdown Banner if Ready for Pickup */}
      {order.order_status === 'ready_for_pickup' && (
        <View style={[styles.timerBanner, isExpired && styles.timerExpiredBanner]}>
          <Timer size={14} color={isExpired ? colors.accentRed : '#B45309'} />
          <Text style={[styles.timerText, isExpired && styles.timerExpiredText]}>
            Pickup Window: {timeLeftStr}
          </Text>
        </View>
      )}

      {/* Canteen & User Info */}
      <View style={styles.detailsRow}>
        <Text style={styles.canteenNameText}>{order.canteen_name_snapshot}</Text>
        {isOperatorView && (
          <Text style={styles.customerText}>By: {order.user_name_snapshot}</Text>
        )}
      </View>

      {/* Items Summary */}
      <View style={styles.itemsBox}>
        <Text style={styles.itemsText} numberOfLines={2}>
          {itemsSummary}
        </Text>
        <Text style={styles.amountText}>₹{order.total}</Text>
      </View>

      {/* Operator Action Buttons */}
      {isOperatorView && (
        <View style={styles.actionButtonsRow}>
          {order.order_status === 'awaiting_acceptance' && (
            <>
              <TouchableOpacity
                style={[styles.btn, styles.declineBtn]}
                onPress={() => onDecline && onDecline(order)}
                activeOpacity={0.8}
              >
                <XCircle size={14} color={colors.accentRed} />
                <Text style={styles.declineBtnText}>Decline</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btn, styles.acceptBtn]}
                onPress={() => onAccept && onAccept(order)}
                activeOpacity={0.8}
              >
                <CheckCircle2 size={14} color="#FFFFFF" />
                <Text style={styles.acceptBtnText}>Accept (Start Prep)</Text>
              </TouchableOpacity>
            </>
          )}

          {order.order_status === 'preparing' && (
            <>
              {order.payment_status === 'CASH_PENDING' ? (
                <View style={styles.cashActionStack}>
                  <TouchableOpacity
                    style={[styles.btn, styles.cashReceivedBtn]}
                    onPress={() => onMarkCashReceived && onMarkCashReceived(order)}
                    activeOpacity={0.8}
                  >
                    <Banknote size={15} color="#FFFFFF" />
                    <Text style={styles.cashReceivedBtnText}>Mark Cash Received</Text>
                  </TouchableOpacity>

                  <View style={styles.blockedReadyNotice}>
                    <AlertCircle size={12} color={colors.textSecondary} />
                    <Text style={styles.blockedReadyText}>Collect cash before marking ready</Text>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.btn, styles.readyBtn]}
                  onPress={() => onMarkReady && onMarkReady(order)}
                  activeOpacity={0.8}
                >
                  <CheckCircle2 size={15} color="#FFFFFF" />
                  <Text style={styles.readyBtnText}>Mark Ready for Pickup</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {order.order_status === 'ready_for_pickup' && (
            <TouchableOpacity
              style={[styles.btn, styles.collectBtn]}
              onPress={() => onMarkCollected && onMarkCollected(order)}
              activeOpacity={0.8}
            >
              <CheckCircle2 size={15} color="#FFFFFF" />
              <Text style={styles.collectBtnText}>Verify & Handover</Text>
            </TouchableOpacity>
          )}

          {order.order_status === 'picked_up' && (
            <View style={styles.completedBanner}>
              <Text style={styles.completedText}>✓ Picked Up & Completed</Text>
            </View>
          )}

          {order.order_status === 'not_collected' && (
            <View style={styles.expiredBanner}>
              <Text style={styles.expiredBannerText}>✕ Unclaimed / Expired</Text>
            </View>
          )}

          {order.order_status === 'declined' && (
            <View style={styles.declinedBanner}>
              <Text style={styles.declinedText}>Order Declined</Text>
            </View>
          )}

          {order.order_status === 'cancelled' && (
            <View style={styles.declinedBanner}>
              <Text style={styles.declinedText}>Order Cancelled</Text>
            </View>
          )}
        </View>
      )}

      {/* Student View "Track Order" button */}
      {!isOperatorView && onPressTrack && (
        <TouchableOpacity
          style={styles.trackButton}
          onPress={() => onPressTrack(order)}
          activeOpacity={0.7}
        >
          <Text style={styles.trackButtonText}>View Status & Token</Text>
          <ArrowRight size={14} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tokenContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenBadge: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenText: {
    fontSize: 18,
    fontWeight: typography.fontWeights.heavy,
    color: colors.primaryDark,
    letterSpacing: 0.5,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preorderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    gap: 3,
  },
  preorderPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#92400E',
  },
  instantPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    gap: 3,
  },
  instantPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  orderIdText: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  paymentRow: {
    marginTop: 6,
    flexDirection: 'row',
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  paidBadge: {
    backgroundColor: '#ECFDF5',
  },
  cashPendingBadge: {
    backgroundColor: '#FFFBEB',
  },
  paymentText: {
    fontSize: 10,
    fontWeight: typography.fontWeights.bold,
  },
  timerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    marginTop: 8,
    gap: 6,
  },
  timerExpiredBanner: {
    backgroundColor: '#FEE2E2',
  },
  timerText: {
    fontSize: 11,
    fontWeight: typography.fontWeights.bold,
    color: '#92400E',
  },
  timerExpiredText: {
    color: colors.accentRed,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  canteenNameText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  customerText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  itemsBox: {
    backgroundColor: colors.backgroundSoft,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemsText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  amountText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.heavy,
    color: colors.primaryDark,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cashActionStack: {
    flex: 1,
    gap: 4,
  },
  cashReceivedBtn: {
    backgroundColor: '#D97706',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    gap: 6,
  },
  cashReceivedBtnText: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeights.bold,
    fontSize: 13,
  },
  blockedReadyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  blockedReadyText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    gap: 6,
  },
  acceptBtn: {
    backgroundColor: colors.primary,
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeights.bold,
    fontSize: 13,
  },
  declineBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  declineBtnText: {
    color: colors.accentRed,
    fontWeight: typography.fontWeights.bold,
    fontSize: 13,
  },
  readyBtn: {
    backgroundColor: colors.accentGreen,
  },
  readyBtnText: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeights.bold,
    fontSize: 13,
  },
  collectBtn: {
    backgroundColor: colors.primaryDark,
  },
  collectBtnText: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeights.bold,
    fontSize: 13,
  },
  completedBanner: {
    flex: 1,
    backgroundColor: '#ECFDF5',
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  completedText: {
    color: colors.accentGreen,
    fontWeight: typography.fontWeights.bold,
    fontSize: 12,
  },
  expiredBanner: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  expiredBannerText: {
    color: colors.accentRed,
    fontWeight: typography.fontWeights.bold,
    fontSize: 12,
  },
  declinedBanner: {
    flex: 1,
    backgroundColor: '#FEF2F2',
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  declinedText: {
    color: colors.accentRed,
    fontWeight: typography.fontWeights.bold,
    fontSize: 12,
  },
  trackButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 4,
  },
  trackButtonText: {
    fontSize: typography.fontSizes.xs,
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
});
