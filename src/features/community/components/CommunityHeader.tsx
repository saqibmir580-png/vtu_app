import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

interface CommunityHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onPressBack?: () => void;
  onPressUpload?: () => void;
  onPressMyUploads?: () => void;
}

export const CommunityHeader: React.FC<CommunityHeaderProps> = ({
  title = 'VTU Community',
  subtitle = 'Discover & Share Student Notes',
  showBack = false,
  onPressBack,
  onPressUpload,
  onPressMyUploads,
}) => {
  return (
    <View style={styles.headerBackground}>
      <SafeAreaView edges={['top']}>
        <View style={styles.headerRow}>
          {showBack ? (
            <TouchableOpacity style={styles.iconBtn} onPress={onPressBack}>
              <Feather name="arrow-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <View style={styles.logoPill}>
              <Feather name="users" size={16} color="#FFFFFF" />
            </View>
          )}

          <View style={styles.titleWrapper}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          <View style={styles.rightIcons}>
            {onPressUpload && (
              <TouchableOpacity style={styles.iconBtn} onPress={onPressUpload}>
                <Feather name="plus" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}

            {onPressMyUploads && (
              <TouchableOpacity style={styles.iconBtn} onPress={onPressMyUploads}>
                <Feather name="user" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  headerBackground: {
    backgroundColor: '#0745E8',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  logoPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrapper: {
    flex: 1,
    marginHorizontal: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.82)',
    marginTop: 1,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
