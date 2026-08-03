import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Heading2 } from './Typography';
import { useTheme } from '../../hooks/useTheme';
import { spacing, typography } from '../../constants/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: {
    icon: string;
    onPress: () => void;
    accessibilityLabel?: string;
  };
  leftAction?: {
    icon: string;
    onPress: () => void;
  };
}

export function ScreenHeader({ title, subtitle, rightAction, leftAction }: ScreenHeaderProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderBottomColor: theme.divider }]}>
      <View style={styles.row}>
        {leftAction && (
          <TouchableOpacity onPress={leftAction.onPress} style={styles.iconBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name={leftAction.icon as any} size={24} color={theme.textPrimary} />
          </TouchableOpacity>
        )}
        <View style={styles.titleGroup}>
          <Heading2>{title}</Heading2>
          {subtitle && (
            <View style={styles.subtitleRow}>
              <MaterialCommunityIcons name="circle-small" size={14} color={theme.success} />
              <View style={{ marginLeft: 0 }}>
                <Heading2 style={{ fontSize: typography.sm, fontWeight: '400', color: theme.textSecondary }}>
                  {subtitle}
                </Heading2>
              </View>
            </View>
          )}
        </View>
        {rightAction && (
          <TouchableOpacity
            onPress={rightAction.onPress}
            style={[styles.iconBtn, styles.iconBtnRight, { backgroundColor: theme.primaryLight }]}
            activeOpacity={0.7}
            accessibilityLabel={rightAction.accessibilityLabel}
          >
            <MaterialCommunityIcons name={rightAction.icon as any} size={22} color={theme.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + spacing[4] : spacing[4],
    paddingBottom: spacing[3],
    paddingHorizontal: spacing[5],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleGroup: {
    flex: 1,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnRight: {
    marginLeft: spacing[2],
  },
});
