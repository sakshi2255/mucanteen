import React, { createContext, useContext, useState } from 'react';
import { Alert } from 'react-native';
import type { CartItem, MenuItem, OrderItemSnapshot, OrderType, PaymentMethod } from '../models/types';

interface CartContextType {
  items: CartItem[];
  activeCanteenId: string | null;
  activeCanteenName: string | null;
  orderType: OrderType;
  pickupTime: string;
  paymentMethod: PaymentMethod;
  policyAccepted: boolean;
  subtotal: number;
  total: number;
  itemCount: number;
  addToCart: (item: MenuItem, canteenName?: string) => void;
  removeFromCart: (item: MenuItem) => void;
  clearCart: () => void;
  setOrderType: (type: OrderType) => void;
  setPickupTime: (time: string) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setPolicyAccepted: (accepted: boolean) => void;
  reorderItems: (
    items: OrderItemSnapshot[],
    canteenId: string,
    canteenName: string,
    menuLookup: MenuItem[]
  ) => void;
}

const CartContext = createContext<CartContextType>({} as CartContextType);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [activeCanteenId, setActiveCanteenId] = useState<string | null>(null);
  const [activeCanteenName, setActiveCanteenName] = useState<string | null>(null);
  const [orderType, setOrderType] = useState<OrderType>('instant');
  const [pickupTime, setPickupTime] = useState<string>('Immediate');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('online_demo');
  const [policyAccepted, setPolicyAccepted] = useState<boolean>(false);

  const addToCart = (item: MenuItem, canteenName?: string) => {
    // Single Canteen Enforcement Check
    if (activeCanteenId && activeCanteenId !== item.canteen_id && items.length > 0) {
      Alert.alert(
        'Switch Canteen?',
        'Your cart already contains items from another canteen. Clear cart and add this item?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear & Add',
            style: 'destructive',
            onPress: () => {
              setActiveCanteenId(item.canteen_id);
              setActiveCanteenName(canteenName || item.canteen_id);
              setItems([{ item, quantity: 1 }]);
            },
          },
        ]
      );
      return;
    }

    if (!activeCanteenId) {
      setActiveCanteenId(item.canteen_id);
      setActiveCanteenName(canteenName || item.canteen_id);
    }

    setItems((prev) => {
      const existing = prev.find((i) => i.item.menu_item_id === item.menu_item_id);
      if (existing) {
        return prev.map((i) =>
          i.item.menu_item_id === item.menu_item_id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const removeFromCart = (item: MenuItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.item.menu_item_id === item.menu_item_id);
      if (!existing) return prev;

      if (existing.quantity === 1) {
        const remaining = prev.filter((i) => i.item.menu_item_id !== item.menu_item_id);
        if (remaining.length === 0) {
          setActiveCanteenId(null);
          setActiveCanteenName(null);
        }
        return remaining;
      }

      return prev.map((i) =>
        i.item.menu_item_id === item.menu_item_id
          ? { ...i, quantity: i.quantity - 1 }
          : i
      );
    });
  };

  const clearCart = () => {
    setItems([]);
    setActiveCanteenId(null);
    setActiveCanteenName(null);
    setPolicyAccepted(false);
  };

  const reorderItems = (
    orderItems: OrderItemSnapshot[],
    canteenId: string,
    canteenName: string,
    menuLookup: MenuItem[]
  ) => {
    const newItems: CartItem[] = [];
    for (const snap of orderItems) {
      const found = menuLookup.find((m) => m.menu_item_id === snap.menu_item_id);
      if (found && found.is_available) {
        newItems.push({ item: found, quantity: snap.quantity });
      } else {
        // Fallback constructed item if not in current menu cache
        newItems.push({
          item: {
            menu_item_id: snap.menu_item_id,
            menu_category_id: 'reordered',
            item_name: snap.item_name,
            description: '',
            canteen_id: canteenId,
            price: snap.price,
            is_veg: snap.is_veg,
            placeholder_key: snap.placeholder_key,
            image_url: null,
            is_available: true,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          quantity: snap.quantity,
        });
      }
    }

    setActiveCanteenId(canteenId);
    setActiveCanteenName(canteenName);
    setItems(newItems);
  };

  const subtotal = items.reduce((sum, i) => sum + i.item.price * i.quantity, 0);
  const total = subtotal;
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        activeCanteenId,
        activeCanteenName,
        orderType,
        pickupTime,
        paymentMethod,
        policyAccepted,
        subtotal,
        total,
        itemCount,
        addToCart,
        removeFromCart,
        clearCart,
        setOrderType,
        setPickupTime,
        setPaymentMethod,
        setPolicyAccepted,
        reorderItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
