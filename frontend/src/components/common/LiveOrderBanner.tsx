import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Clock, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { colors } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { styles } from '../../styles/comman/LiveOrderBannerStyles';
import type { Order } from '../../models/types';

export const LiveOrderBanner = () => {
  const { user, firebaseUser } = useAuth();
  const navigation = useNavigation<any>();
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!user) {
      setActiveOrders([]);
      return;
    }

    const userIds = new Set<string>([user.user_id]);
    if (firebaseUser?.uid && firebaseUser.email?.toLowerCase() === user.email?.toLowerCase()) {
      userIds.add(firebaseUser.uid);
    }

    const idList = Array.from(userIds).filter(Boolean);
    if (idList.length === 0) return;

    const q =
      idList.length > 1
        ? query(collection(db, 'orders'), where('user_id', 'in', idList))
        : query(collection(db, 'orders'), where('user_id', '==', idList[0]));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const active = snapshot.docs
          .map((d) => d.data() as Order)
          .filter((o) =>
            ['scheduled', 'awaiting_acceptance', 'preparing', 'ready_for_pickup'].includes(
              o.order_status
            )
          )
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setActiveOrders(active);
        setCurrentIndex((prev) => (prev >= active.length ? 0 : prev));
      },
      (error) => {
        console.warn('Live order banner listener error:', error.message);
      }
    );

    return unsub;
  }, [user, firebaseUser?.uid, firebaseUser?.email]);

  if (activeOrders.length === 0) return null;

  const safeIndex = currentIndex < activeOrders.length ? currentIndex : 0;
  const currentOrder = activeOrders[safeIndex] || activeOrders[0];

  let statusMsg = 'Order Placed';
  if (currentOrder.order_status === 'scheduled') statusMsg = 'Preorder Scheduled';
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
                Order {safeIndex + 1} of {activeOrders.length}
              </Text>
            </View>
          </View>
        )}
        <Text style={styles.statusText} numberOfLines={1}>
          {statusMsg} · Token #{currentOrder.token_display}
        </Text>
        <Text style={styles.canteenText} numberOfLines={1}>
          {currentOrder.canteen_name_snapshot}
        </Text>

        {activeOrders.length > 1 && (
          <View style={styles.dotsRow}>
            {activeOrders.map((ord, idx) => (
              <View
                key={ord.order_id}
                style={[styles.dot, idx === safeIndex && styles.activeDot]}
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