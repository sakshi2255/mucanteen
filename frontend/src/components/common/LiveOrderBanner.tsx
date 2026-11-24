import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Clock, ArrowRight, ChevronLeft, ChevronRight, Utensils } from 'lucide-react-native';
import { colors } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { listenStudentOrders } from '../../services/firestoreService';
import { styles } from '../../styles/comman/LiveOrderBannerStyles';
import type { Order } from '../../models/types';

export const LiveOrderBanner = () => {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!user) return;
    const unsub = listenStudentOrders(user.user_id, (orders) => {
      // Find all orders that are currently active (until picked up or completed)
      const active = orders.filter((o) =>
        ['awaiting_acceptance', 'preparing', 'ready_for_pickup'].includes(o.order_status)
      );
      setActiveOrders(active);
      if (currentIndex >= active.length && active.length > 0) {
        setCurrentIndex(0);
      }
    });
    return unsub;
  }, [user, currentIndex]);

  if (activeOrders.length === 0) return null;

  const currentOrder = activeOrders[currentIndex] || activeOrders[0];

  let statusMsg = 'Order Placed';
  if (currentOrder.order_status === 'preparing') statusMsg = 'Food is being prepared';
  if (currentOrder.order_status === 'ready_for_pickup') statusMsg = 'Ready for Pickup!';

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : activeOrders.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < activeOrders.length - 1 ? prev + 1 : 0));
  };

  return (
    <View style={styles.container}>
      <Clock size={22} color={colors.primaryLight} />
      
      <View style={styles.infoCol}>
        {activeOrders.length > 1 && (
          <View style={styles.multiHeaderRow}>
            <View style={styles.orderIndexBadge}>
              <Text style={styles.orderIndexText}>
                Order {currentIndex + 1} of {activeOrders.length}
              </Text>
            </View>
          </View>
        )}
        <Text style={styles.statusText}>
          {statusMsg} · Token #{currentOrder.token_display}
        </Text>
        <Text style={styles.canteenText} numberOfLines={1}>
          {currentOrder.canteen_name_snapshot}
        </Text>

        {activeOrders.length > 1 && (
          <View style={styles.dotsRow}>
            {activeOrders.map((_, idx) => (
              <View
                key={idx}
                style={[styles.dot, idx === currentIndex && styles.activeDot]}
              />
            ))}
          </View>
        )}
      </View>

      <View style={styles.actionsCol}>
        {activeOrders.length > 1 && (
          <>
            <TouchableOpacity
              style={styles.navArrowBtn}
              onPress={handlePrev}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ChevronLeft size={16} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navArrowBtn}
              onPress={handleNext}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ChevronRight size={16} color="#ffffff" />
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={styles.trackBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('OrderTracking', { order: currentOrder })}
        >
          <Text style={styles.trackBtnText}>Track</Text>
          <ArrowRight size={16} color={colors.primaryDark} />
        </TouchableOpacity>
      </View>
    </View>
  );
};
