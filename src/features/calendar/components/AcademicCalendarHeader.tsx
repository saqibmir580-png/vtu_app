import React from 'react';
import { StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Header } from '@/shared/components/Header';

interface AcademicCalendarHeaderProps {
  title?: string;
  showBack?: boolean;
  onFilterPress?: () => void;
}

export const AcademicCalendarHeader: React.FC<AcademicCalendarHeaderProps> = ({
  title = 'Academic Calendar',
  showBack = true,
  onFilterPress,
}) => {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0745E8" />
      <Header
        title={title}
        dark={true}
        showBack={showBack}
        rightElement={
          onFilterPress ? (
            <TouchableOpacity onPress={onFilterPress} style={styles.filterBtn}>
              <Feather name="sliders" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          ) : undefined
        }
      />
    </>
  );
};

const styles = StyleSheet.create({
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
