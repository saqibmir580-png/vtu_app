import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

export interface CustomConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'success' | 'info';
  icon?: keyof typeof Feather.glyphMap;
  showCancel?: boolean;
}

export const CustomConfirmationModal: React.FC<CustomConfirmationModalProps> = ({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info',
  icon,
  showCancel = true,
}) => {
  const isDanger = type === 'danger';
  const isSuccess = type === 'success';

  const defaultIcon: keyof typeof Feather.glyphMap = isDanger
    ? 'log-out'
    : isSuccess
    ? 'check-circle'
    : 'info';

  const activeIcon = icon || defaultIcon;

  const iconBg = isDanger ? '#FEE2E2' : isSuccess ? '#DCFCE7' : '#EEF2FF';
  const iconColor = isDanger ? '#DC2626' : isSuccess ? '#16A34A' : '#0745E8';
  const confirmBtnBg = isDanger ? '#DC2626' : isSuccess ? '#16A34A' : '#0745E8';

  const handleConfirmPress = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.dialogContainer}>
              {/* Icon Circle */}
              <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
                <Feather name={activeIcon} size={26} color={iconColor} />
              </View>

              {/* Title & Message */}
              <Text style={styles.titleText}>{title}</Text>
              <Text style={styles.messageText}>{message}</Text>

              {/* Actions Row */}
              <View style={styles.actionsRow}>
                {showCancel && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.cancelBtn}
                    onPress={onClose}
                  >
                    <Text style={styles.cancelBtnText}>{cancelText}</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[
                    styles.confirmBtn,
                    { backgroundColor: confirmBtnBg },
                    !showCancel && { flex: 1 },
                  ]}
                  onPress={handleConfirmPress}
                >
                  <Text style={styles.confirmBtnText}>{confirmText}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  dialogContainer: {
    width: Math.min(width - 48, 360),
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingTop: 28,
    paddingBottom: 22,
    paddingHorizontal: 22,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  titleText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  messageText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
