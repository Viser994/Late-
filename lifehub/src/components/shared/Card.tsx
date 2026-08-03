import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { radius, spacing, shadows } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  elevated?: boolean;
  noPadding?: boolean;
}

export function Card({ children, style, elevated = false, noPadding = false }: CardProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: theme.surface,
          borderColor: theme.cardBorder,
        },
        elevated && (shadows.md as ViewStyle),
        !noPadding && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  padded: {
    padding: spacing[4],
  },
});
