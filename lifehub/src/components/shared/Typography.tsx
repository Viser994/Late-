import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { typography } from '../../constants/theme';

interface TypographyProps {
  children: React.ReactNode;
  style?: TextStyle | TextStyle[];
  numberOfLines?: number;
}

const makeText = (
  defaultSize: number,
  defaultWeight: TextStyle['fontWeight'],
  colorKey: 'textPrimary' | 'textSecondary' | 'textTertiary' = 'textPrimary',
) =>
  function Component({ children, style, numberOfLines }: TypographyProps) {
    const { theme } = useTheme();
    return (
      <Text
        numberOfLines={numberOfLines}
        style={[
          { fontSize: defaultSize, fontWeight: defaultWeight, color: theme[colorKey] },
          style,
        ]}
      >
        {children}
      </Text>
    );
  };

export const Heading1 = makeText(typography['2xl'], typography.weight.bold);
export const Heading2 = makeText(typography.xl, typography.weight.bold);
export const Heading3 = makeText(typography.lg, typography.weight.semibold);
export const BodyLarge = makeText(typography.md, typography.weight.regular);
export const Body = makeText(typography.base, typography.weight.regular);
export const BodySmall = makeText(typography.sm, typography.weight.regular, 'textSecondary');
export const Caption = makeText(typography.xs, typography.weight.medium, 'textTertiary');
export const Label = makeText(typography.sm, typography.weight.semibold);
