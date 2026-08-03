import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Text,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useTaskStore } from '../store/taskStore';
import { useSettingsStore } from '../store/settingsStore';
import { TaskCard } from '../components/today/TaskCard';
import { SummaryStrip } from '../components/today/SummaryStrip';
import { AddTaskSheet } from '../components/today/AddTaskSheet';
import { EmptyState } from '../components/shared/EmptyState';
import { Heading3, BodySmall, Label } from '../components/shared/Typography';
import { spacing, typography, radius } from '../constants/theme';
import { Task } from '../types';
import { format } from 'date-fns';

export function TodayScreen() {
  const { theme } = useTheme();
  const { user } = useSettingsStore();
  const {
    tasks,
    getTodayTasks,
    getUpcomingTasks,
    getOverdueTasks,
    getTasksByStatus,
    loadTasks,
  } = useTaskStore();

  const [showAddTask, setShowAddTask] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'done'>('today');

  const todayTasks = getTodayTasks();
  const upcomingTasks = getUpcomingTasks();
  const overdueTasks = getOverdueTasks();
  const completedTasks = getTasksByStatus('completed');

  const displayedTasks =
    activeTab === 'today'
      ? [...overdueTasks, ...todayTasks]
      : activeTab === 'upcoming'
      ? upcomingTasks
      : completedTasks;

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const firstName = user.name.split(' ')[0];
  const today = format(new Date(), 'EEEE, MMMM d');

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.divider }]}>
        <View>
          <BodySmall style={{ color: theme.textSecondary }}>{today}</BodySmall>
          <Heading3 style={{ color: theme.textPrimary, marginTop: 2 }}>
            {greeting}, {firstName} 👋
          </Heading3>
        </View>
        <TouchableOpacity
          onPress={() => setShowAddTask(true)}
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayedTasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary} />
        }
        ListHeaderComponent={
          <View>
            {/* Summary stats */}
            <SummaryStrip
              overdueCount={overdueTasks.length}
              todayCount={todayTasks.length}
              completedCount={completedTasks.length}
            />

            {/* Tabs */}
            <View style={[styles.tabs, { backgroundColor: theme.surfaceMuted }]}>
              {(['today', 'upcoming', 'done'] as const).map((tab) => {
                const active = activeTab === tab;
                const count =
                  tab === 'today'
                    ? todayTasks.length + overdueTasks.length
                    : tab === 'upcoming'
                    ? upcomingTasks.length
                    : completedTasks.length;
                return (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    style={[
                      styles.tab,
                      active && { backgroundColor: theme.surface, ...tabShadow },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabLabel,
                        { color: active ? theme.textPrimary : theme.textTertiary },
                      ]}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Text>
                    {count > 0 && (
                      <View
                        style={[
                          styles.badge,
                          {
                            backgroundColor: active
                              ? tab === 'done'
                                ? theme.success
                                : theme.primary
                              : theme.divider,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            { color: active ? '#fff' : theme.textTertiary },
                          ]}
                        >
                          {count}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {displayedTasks.length > 0 && activeTab === 'today' && overdueTasks.length > 0 && (
              <View style={styles.overdueBanner}>
                <MaterialCommunityIcons name="clock-alert" size={14} color={theme.urgent} />
                <BodySmall style={{ color: theme.urgent, marginLeft: spacing[1] }}>
                  {overdueTasks.length} overdue item{overdueTasks.length > 1 ? 's' : ''} — take care of these first
                </BodySmall>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <TaskCard task={item} />
        )}
        ListEmptyComponent={
          <EmptyState
            icon={activeTab === 'done' ? 'check-circle-outline' : 'calendar-check-outline'}
            title={
              activeTab === 'today'
                ? "You're all caught up!"
                : activeTab === 'upcoming'
                ? 'No upcoming tasks'
                : 'Nothing completed yet'
            }
            description={
              activeTab === 'today'
                ? 'No tasks for today. Add a reminder or bill to get started.'
                : activeTab === 'upcoming'
                ? 'Schedule tasks and bills to see them here.'
                : 'Completed tasks will appear here.'
            }
            actionLabel={activeTab !== 'done' ? 'Add Reminder' : undefined}
            onAction={activeTab !== 'done' ? () => setShowAddTask(true) : undefined}
          />
        }
      />

      <AddTaskSheet visible={showAddTask} onClose={() => setShowAddTask(false)} />
    </View>
  );
}

const tabShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 2,
  elevation: 1,
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[6],
    paddingBottom: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  addBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[12],
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing[4],
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2] + 2,
    borderRadius: radius.md - 2,
    gap: spacing[1],
  },
  tabLabel: {
    fontSize: typography.sm,
    fontWeight: typography.weight.semibold,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  overdueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
});
