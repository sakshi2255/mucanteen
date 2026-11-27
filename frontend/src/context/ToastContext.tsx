import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react-native';
import { colors } from '../config/theme';
import { styles } from '../styles/comman/ToastStyles';

export type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  title: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
  hideToast: () => {},
});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', title?: string) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      const defaultTitle =
        type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Notice';

      setToast({
        title: title || defaultTitle,
        message,
        type,
      });

      timerRef.current = setTimeout(() => {
        setToast(null);
        timerRef.current = null;
      }, 3200);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const variantStyle =
    toast?.type === 'success'
      ? styles.toastSuccess
      : toast?.type === 'error'
        ? styles.toastError
        : styles.toastInfo;

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <SafeAreaView
          edges={['top']}
          pointerEvents="box-none"
          style={styles.toastOverlay}
        >
          <View style={[styles.toastCard, variantStyle]}>
            <View style={styles.iconWrap}>
              {toast.type === 'success' ? (
                <CheckCircle2 size={20} color={colors.accentGreen} />
              ) : toast.type === 'error' ? (
                <AlertCircle size={20} color={colors.accentRed} />
              ) : (
                <Info size={20} color={colors.primary} />
              )}
            </View>
            <View style={styles.textCol}>
              <Text style={styles.toastTitle}>{toast.title}</Text>
              <Text style={styles.toastMessage}>{toast.message}</Text>
            </View>
            <TouchableOpacity onPress={hideToast} style={styles.closeBtn}>
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);