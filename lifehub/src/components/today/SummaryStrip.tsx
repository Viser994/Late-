import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Label, Caption } from '../shared/Typography';
import { radius, spacing } from '../../constants/theme';

interface StatProps {
  icon: string;
  label: string;
  value: string | number;
  color: string;
  bgColor: string;
}

function Stat({ icon, label, value, color, bgColor }: StatProps) {
  const { theme } = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: bgColor }]}>
      <MaterialCommunityIcons name={icon as any} size={20} color={color} />
      <Label style={[styles.statValue, { color }]}>{value}</Label>
      <Caption style={{ color }}>{label}</Caption>
    </View>
  );
}

interface SummaryStripProps {
  overdueCount: number;
  todayCount: number;
  completedCount: number;
}

export function SummaryStrip({ overdueCount, todayCount, completedCount }: SummaryStripProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.row}>
      <Stat
        icon="clock-alert"
        label="Overdue"
        value={overdueCount}
        color={theme.urgent}
        bgColor={theme.urgentLight}
      />
      <Stat
        icon="calendar-today"
        label="Today"
        value={todayCount}
        color={theme.primary}
        bgColor={theme.primaryLight}
      />
      <Stat
        icon="check-circle"
        label="Done"
        value={completedCount}
        color={theme.success}
        bgColor={theme.successLight}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[5],
  },
  stat: {
    flex: 1,
    borderRadius: radius.lg,
    alignItems: 'center',
    paddingVertical: spacing[3],
    gap: 3,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
});
