import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Pressable,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react-native';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm' | 'default';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertConfig {
  title: string;
  message?: string;
  type?: AlertType;
  buttons?: AlertButton[];
}

interface AlertContextValue {
  alert: (config: AlertConfig) => void;
  confirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    options?: { confirmText?: string; cancelText?: string; destructive?: boolean },
  ) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AlertContext = createContext<AlertContextValue | null>(null);

export function useAlert(): AlertContextValue {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlert must be used inside <AlertProvider>');
  return ctx;
}

// ---------------------------------------------------------------------------
// Icon map
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, { Icon: any; color: string; bg: string }> = {
  success: { Icon: CheckCircle, color: '#10B981', bg: '#ECFDF5' },
  error: { Icon: XCircle, color: '#EF4444', bg: '#FEF2F2' },
  warning: { Icon: AlertTriangle, color: '#F59E0B', bg: '#FFFBEB' },
  info: { Icon: Info, color: '#4F46E5', bg: '#EEF2FF' },
  confirm: { Icon: Info, color: '#4F46E5', bg: '#EEF2FF' },
};

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertConfig | null>(null);

  const show = useCallback((cfg: AlertConfig) => {
    setConfig(cfg);
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    setVisible(false);
    setTimeout(() => setConfig(null), 300);
  }, []);

  const alert = useCallback(
    (cfg: AlertConfig) => {
      show({
        ...cfg,
        buttons: cfg.buttons ?? [{ text: 'OK', style: 'default' }],
      });
    },
    [show],
  );

  const confirm = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      options?: { confirmText?: string; cancelText?: string; destructive?: boolean },
    ) => {
      show({
        title,
        message,
        type: options?.destructive ? 'warning' : 'confirm',
        buttons: [
          { text: options?.cancelText ?? 'Cancel', style: 'cancel' },
          {
            text: options?.confirmText ?? 'Confirm',
            style: options?.destructive ? 'destructive' : 'default',
            onPress: onConfirm,
          },
        ],
      });
    },
    [show],
  );

  const success = useCallback(
    (title: string, message?: string) => {
      show({ title, message, type: 'success', buttons: [{ text: 'OK' }] });
    },
    [show],
  );

  const error = useCallback(
    (title: string, message?: string) => {
      show({ title, message, type: 'error', buttons: [{ text: 'OK' }] });
    },
    [show],
  );

  const handleButton = (btn: AlertButton) => {
    btn.onPress?.();
    hide();
  };

  const alertType = config?.type ?? 'default';
  const iconData = ICON_MAP[alertType];

  return (
    <AlertContext.Provider value={{ alert, confirm, success, error }}>
      {children}

      <Modal
        transparent
        visible={visible}
        animationType="none"
        statusBarTranslucent
        onRequestClose={hide}
      >
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          className="flex-1 bg-black/50 items-center justify-center px-8"
        >
          <TouchableWithoutFeedback onPress={hide}>
            <View className="absolute inset-0" />
          </TouchableWithoutFeedback>

          <Animated.View
            entering={ZoomIn.duration(250).springify()}
            exiting={ZoomOut.duration(150)}
            className="bg-white rounded-2xl w-full overflow-hidden"
            style={{
              shadowColor: '#4F46E5',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 24,
              elevation: 12,
            }}
          >
            {/* Close button */}
            <TouchableOpacity
              onPress={hide}
              activeOpacity={0.7}
              className="absolute top-3 right-3 z-10 w-8 h-8 items-center justify-center rounded-full bg-gray-100"
            >
              <X size={16} color="#6B7280" />
            </TouchableOpacity>

            {/* Content */}
            <View className="px-6 pt-8 pb-6 items-center">
              {/* Icon */}
              {iconData && (
                <View
                  className="w-14 h-14 rounded-full items-center justify-center mb-4"
                  style={{ backgroundColor: iconData.bg }}
                >
                  <iconData.Icon size={28} color={iconData.color} />
                </View>
              )}

              {/* Title */}
              <Text className="text-lg font-bold text-gray-900 text-center">
                {config?.title}
              </Text>

              {/* Message */}
              {config?.message ? (
                <Text className="text-sm text-gray-500 text-center mt-2 leading-5">
                  {config.message}
                </Text>
              ) : null}
            </View>

            {/* Buttons */}
            <View className="px-6 pb-6">
              {config?.buttons && config.buttons.length === 1 ? (
                // Single button — full width
                <TouchableOpacity
                  onPress={() => handleButton(config.buttons![0])}
                  activeOpacity={0.8}
                  className="bg-brand py-3.5 rounded-xl items-center"
                >
                  <Text className="text-white font-semibold text-base">
                    {config.buttons[0].text}
                  </Text>
                </TouchableOpacity>
              ) : (
                // Multiple buttons — row
                <View className="flex-row gap-3">
                  {config?.buttons?.map((btn, i) => {
                    const isCancel = btn.style === 'cancel';
                    const isDestructive = btn.style === 'destructive';
                    return (
                      <TouchableOpacity
                        key={i}
                        onPress={() => handleButton(btn)}
                        activeOpacity={0.8}
                        className={`flex-1 py-3.5 rounded-xl items-center ${
                          isCancel
                            ? 'bg-gray-100'
                            : isDestructive
                              ? 'bg-red-500'
                              : 'bg-brand'
                        }`}
                      >
                        <Text
                          className={`font-semibold text-base ${
                            isCancel
                              ? 'text-gray-700'
                              : 'text-white'
                          }`}
                        >
                          {btn.text}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </AlertContext.Provider>
  );
}
