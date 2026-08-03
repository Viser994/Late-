import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Task } from '../../types';
import { useTheme } from '../../hooks/useTheme';
import { useTaskStore } from '../../store/taskStore';
import { PriorityBadge } from '../shared/Badge';
import { Label, Body, BodySmall, Caption } from '../shared/Typography';
import { radius, spacing, typography, REMINDER_TYPE_META } from '../../constants/theme';
import { formatDistanceToNow, isPast, isToday, format } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onPress?: (task: Task) => void;
}

export function TaskCard({ task, onPress }: TaskCardProps) {
  const { theme } = useTheme();
  const { completeTask, deleteTask } = useTaskStore();
  const scale = useRef(new Animated.Value(1)).current;

  const typeMeta = REMINDER_TYPE_META[task.type];
  const dueDate = new Date(task.dueDate);
  const isOverdue = isPast(dueDate) && task.status !== 'completed';
  const isDueToday = isToday(dueDate);

  const accentColor = isOverdue
    ? theme.urgent
    : task.priority === 'urgent'
    ? theme.urgent
    : task.priority === 'high'
    ? theme.warning
    : theme.primary;

  const handleComplete = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start(() => completeTask(task.id));
  };

  const handleDelete = () => {
    Alert.alert('Delete Task', `Delete "${task.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTask(task.id) },
    ]);
  };

  const dueDateLabel = (() => {
    if (isOverdue) return `Overdue · ${format(dueDate, 'MMM d')}`;
    if (isDueToday) return 'Due today';
    return formatDistanceToNow(dueDate, { addSuffix: true });
  })();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={() => onPress?.(task)}
        activeOpacity={0.85}
        style={[
          styles.card,
          {
            backgroundColor: theme.surface,
            borderColor: theme.cardBorder,
            borderLeftColor: accentColor,
            opacity: task.status === 'completed' ? 0.55 : 1,
          },
        ]}
      >
        {/* Left accent + type icon */}
        <View style={[styles.iconWrap, { backgroundColor: accentColor + '18' }]}>
          <MaterialCommunityIcons
            name={typeMeta.icon as any}
            size={20}
            color={accentColor}
          />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.topRow}>
            <Label
              numberOfLines={1}
              style={[
                styles.title,
                ...(task.status === 'completed' ? [styles.strikethrough] : []),
                { color: theme.textPrimary },
              ]}
            >
              {task.title}
            </Label>
            <PriorityBadge priority={task.priority} />
          </View>

          {task.description ? (
            <BodySmall numberOfLines={1} style={{ marginTop: 2 }}>
              {task.description}
            </BodySmall>
          ) : null}

          <View style={styles.bottomRow}>
            <MaterialCommunityIcons
              name={isOverdue ? 'clock-alert-outline' : 'clock-outline'}
              size={12}
              color={isOverdue ? theme.urgent : theme.textTertiary}
            />
            <Caption
              style={[
                styles.dueText,
                { color: isOverdue ? theme.urgent : theme.textTertiary },
              ]}
            >
              {dueDateLabel}
            </Caption>

            {task.amount ? (
              <>
                <View style={[styles.dot, { backgroundColor: theme.divider }]} />
                <Caption style={{ color: theme.textTertiary }}>
                  {task.currency ?? '$'}{task.amount.toFixed(2)}
                </Caption>
              </>
            ) : null}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {task.status !== 'completed' && (
            <TouchableOpacity onPress={handleComplete} style={styles.actionBtn} hitSlop={8}>
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={26}
                color={theme.success}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleDelete} style={styles.actionBtn} hitSlop={8}>
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={22}
              color={theme.textTertiary}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: 3.5,
    padding: spacing[3] + 2,
    marginBottom: spacing[2] + 2,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  content: {
    flex: 1,
    marginRight: spacing[2],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  title: {
    flex: 1,
    fontSize: typography.base,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[1],
    gap: spacing[1],
  },
  dueText: {
    marginLeft: 3,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    marginHorizontal: spacing[1],
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  actionBtn: {
    padding: 4,
  },
});
