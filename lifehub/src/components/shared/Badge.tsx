import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { typography, radius, spacing } from '../../constants/theme';
import { Priority } from '../../types';

// ─── Priority Badge ───────────────────────────────────────────────────────────

interface PriorityBadgeProps {
  priority: Priority;
  style?: ViewStyle;
}

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', bg: 'urgentLight', text: 'urgent' },
  high: { label: 'High', bg: 'warningLight', text: 'warning' },
  normal: { label: 'Normal', bg: 'primaryLight', text: 'primary' },
  low: { label: 'Low', bg: 'surfaceMuted', text: 'textSecondary' },
} as const;

export function PriorityBadge({ priority, style }: PriorityBadgeProps) {
  const { theme } = useTheme();
  const config = PRIORITY_CONFIG[priority];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: theme[config.bg as keyof typeof theme] as string },
        style,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          { color: theme[config.text as keyof typeof theme] as string },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

// ─── Tag Badge ────────────────────────────────────────────────────────────────

interface TagBadgeProps {
  label: string;
  style?: ViewStyle;
}

export function TagBadge({ label, style }: TagBadgeProps) {
  const { theme } = useTheme();
  return (
    <View
      style={[styles.badge, { backgroundColor: theme.surfaceMuted }, style]}
    >
      <Text style={[styles.badgeText, { color: theme.textSecondary }]}>
        #{label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing[2] + 2,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: typography.xs,
    fontWeight: typography.weight.semibold,
    letterSpacing: 0.3,
    textTransform: 'capitalize',
  },
});
