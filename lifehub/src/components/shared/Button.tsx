import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { typography, radius, spacing } from '../../constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  onPress,
  title,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  style,
  textStyle,
  fullWidth,
}: ButtonProps) {
  const { theme } = useTheme();

  const containerStyles: ViewStyle[] = [
    styles.base,
    styles[`size_${size}`],
    {
      backgroundColor:
        variant === 'primary'
          ? theme.primary
          : variant === 'danger'
          ? theme.urgent
          : variant === 'secondary'
          ? theme.primaryLight
          : 'transparent',
      borderColor:
        variant === 'secondary' ? theme.primary : 'transparent',
      borderWidth: variant === 'secondary' ? 1.5 : 0,
      opacity: disabled || loading ? 0.5 : 1,
      alignSelf: fullWidth ? 'stretch' : 'auto',
    },
    style ?? {},
  ];

  const labelColor =
    variant === 'primary' || variant === 'danger'
      ? '#FFFFFF'
      : theme.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={containerStyles}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator color={labelColor} size="small" />
      ) : (
        <Text
          style={[
            styles.label,
            styles[`label_${size}`],
            { color: labelColor },
            textStyle ?? {},
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  size_sm: { paddingVertical: spacing[2], paddingHorizontal: spacing[3] },
  size_md: { paddingVertical: spacing[3] + 2, paddingHorizontal: spacing[5] },
  size_lg: { paddingVertical: spacing[4], paddingHorizontal: spacing[6] },
  label: { fontWeight: typography.weight.semibold },
  label_sm: { fontSize: typography.sm },
  label_md: { fontSize: typography.base },
  label_lg: { fontSize: typography.md },
});
