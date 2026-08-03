import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Heading3, Body } from './Typography';
import { Button } from './Button';
import { useTheme } from '../../hooks/useTheme';
import { spacing } from '../../constants/theme';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: theme.primaryLight }]}>
        <MaterialCommunityIcons name={icon as any} size={40} color={theme.primary} />
      </View>
      <Heading3 style={styles.title}>{title}</Heading3>
      <Body style={[styles.desc, { color: theme.textSecondary, textAlign: 'center' }]}>
        {description}
      </Body>
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} style={styles.btn} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[12],
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[5],
  },
  title: {
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  desc: {
    lineHeight: 22,
    marginBottom: spacing[6],
  },
  btn: {
    paddingHorizontal: spacing[6],
  },
});
