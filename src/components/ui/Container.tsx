import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ContainerProps extends ViewProps {
  safe?: boolean;
  padded?: boolean;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  safe = true,
  padded = true,
  style,
  ...props
}) => {
  const Component = safe ? SafeAreaView : View;

  return (
    <Component
      style={[
        styles.container,
        padded && styles.padded,
        style,
      ]}
      {...props}
    >
      {children}
    </Component>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  padded: {
    paddingHorizontal: 16,
  },
});
