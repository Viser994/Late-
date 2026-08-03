import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useSettingsStore } from '../store/settingsStore';
import { useTaskStore } from '../store/taskStore';
import { useDocumentStore } from '../store/documentStore';
import { Heading3, Label, Body, BodySmall, Caption } from '../components/shared/Typography';
import { Card } from '../components/shared/Card';
import { spacing, radius, typography } from '../constants/theme';
import { sendTestNotification, requestNotificationPermission } from '../services/notifications';
import { AppSettings } from '../types';

export function SettingsScreen() {
  const { theme, isDark } = useTheme();
  const { settings, user, updateSettings, updateUser, resetApp } = useSettingsStore();
  const tasks = useTaskStore((s) => s.tasks);
  const documents = useDocumentStore((s) => s.documents);

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user.name);

  const handleThemeChange = (t: AppSettings['theme']) => updateSettings({ theme: t });

  const handleTestNotification = async () => {
    const granted = await requestNotificationPermission();
    if (!granted) {
      Alert.alert(
        'Permission Required',
        'Enable notifications in your device settings to receive reminders.',
      );
      return;
    }
    await sendTestNotification();
    Alert.alert('✅ Done', 'A test notification was sent!');
  };

  const handleReset = () => {
    Alert.alert(
      'Reset App',
      'This will delete all tasks, documents, and settings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            await resetApp();
            await useTaskStore.getState().loadTasks();
            await useDocumentStore.getState().loadDocuments();
          },
        },
      ],
    );
  };

  const saveName = async () => {
    if (nameInput.trim()) await updateUser({ name: nameInput.trim() });
    setEditingName(false);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.divider }]}>
        <Heading3 style={{ color: theme.textPrimary }}>Settings</Heading3>
      </View>

      {/* Profile */}
      <SectionHeader title="Profile" icon="account-circle-outline" theme={theme} />
      <Card style={styles.card}>
        <View style={styles.profileRow}>
          <View style={[styles.avatar, { backgroundColor: theme.primaryLight }]}>
            <MaterialCommunityIcons name="account" size={32} color={theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            {editingName ? (
              <TextInput
                style={[styles.nameInput, { color: theme.textPrimary, borderColor: theme.primary }]}
                value={nameInput}
                onChangeText={setNameInput}
                autoFocus
                onBlur={saveName}
                onSubmitEditing={saveName}
                returnKeyType="done"
              />
            ) : (
              <TouchableOpacity onPress={() => { setNameInput(user.name); setEditingName(true); }}>
                <Label style={{ fontSize: typography.md, color: theme.textPrimary }}>{user.name}</Label>
                <Caption style={{ color: theme.primary, marginTop: 2 }}>Tap to edit name</Caption>
              </TouchableOpacity>
            )}
            <BodySmall style={{ color: theme.textSecondary, marginTop: 2 }}>{user.email}</BodySmall>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.divider }]} />

        <View style={styles.statsRow}>
          <StatBox label="Tasks" value={tasks.length} color={theme.primary} />
          <View style={[styles.statDivider, { backgroundColor: theme.divider }]} />
          <StatBox label="Documents" value={documents.length} color={theme.success} />
          <View style={[styles.statDivider, { backgroundColor: theme.divider }]} />
          <StatBox
            label="Completed"
            value={tasks.filter((t) => t.status === 'completed').length}
            color={theme.warning}
          />
        </View>
      </Card>

      {/* Appearance */}
      <SectionHeader title="Appearance" icon="palette-outline" theme={theme} />
      <Card style={styles.card}>
        <Label style={{ color: theme.textPrimary, marginBottom: spacing[3] }}>Theme</Label>
        {(['light', 'dark', 'system'] as const).map((opt) => (
          <TouchableOpacity
            key={opt}
            onPress={() => handleThemeChange(opt)}
            style={[
              styles.optionRow,
              settings.theme === opt && {
                backgroundColor: theme.primaryLight,
                borderRadius: radius.md,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={opt === 'light' ? 'white-balance-sunny' : opt === 'dark' ? 'weather-night' : 'brightness-auto'}
              size={20}
              color={settings.theme === opt ? theme.primary : theme.textSecondary}
            />
            <Body style={{ flex: 1, marginLeft: spacing[3], color: theme.textPrimary }}>
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </Body>
            {settings.theme === opt && (
              <MaterialCommunityIcons name="check-circle" size={20} color={theme.primary} />
            )}
          </TouchableOpacity>
        ))}
      </Card>

      {/* Notifications */}
      <SectionHeader title="Notifications" icon="bell-outline" theme={theme} />
      <Card style={styles.card}>
        <SettingRow
          icon="bell-ring-outline"
          label="Enable Notifications"
          description="Get reminders for upcoming tasks and bills"
          theme={theme}
        >
          <Switch
            value={settings.notificationsEnabled}
            onValueChange={(v) => updateSettings({ notificationsEnabled: v })}
            trackColor={{ false: theme.divider, true: theme.primary }}
            thumbColor="#fff"
          />
        </SettingRow>

        <View style={[styles.divider, { backgroundColor: theme.divider }]} />

        <TouchableOpacity
          onPress={handleTestNotification}
          style={[styles.optionRow, { paddingVertical: spacing[3] }]}
        >
          <MaterialCommunityIcons name="bell-check-outline" size={20} color={theme.primary} />
          <Body style={{ flex: 1, marginLeft: spacing[3], color: theme.primary }}>
            Send Test Notification
          </Body>
          <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textTertiary} />
        </TouchableOpacity>
      </Card>

      {/* AI */}
      <SectionHeader title="AI Features" icon="robot-outline" theme={theme} />
      <Card style={styles.card}>
        <SettingRow
          icon="robot-outline"
          label="AI Processing"
          description="Auto-extract dates, amounts and summaries from documents"
          theme={theme}
        >
          <Switch
            value={settings.aiProcessingEnabled}
            onValueChange={(v) => updateSettings({ aiProcessingEnabled: v })}
            trackColor={{ false: theme.divider, true: theme.primary }}
            thumbColor="#fff"
          />
        </SettingRow>

        <View style={[styles.divider, { backgroundColor: theme.divider }]} />

        <View style={[styles.aiInfoRow, { backgroundColor: theme.primaryLight }]}>
          <MaterialCommunityIcons name="information-outline" size={16} color={theme.primary} />
          <Caption style={{ color: theme.primary, flex: 1, marginLeft: spacing[2], lineHeight: 18 }}>
            AI features use a placeholder service. Connect OpenAI, Google Document AI, or another
            provider in <Caption style={{ color: theme.primary, fontWeight: '600' }}>src/services/ai.ts</Caption>
          </Caption>
        </View>
      </Card>

      {/* Security */}
      <SectionHeader title="Security" icon="shield-outline" theme={theme} />
      <Card style={styles.card}>
        <SettingRow
          icon="fingerprint"
          label="Biometric Lock"
          description="Require Face ID or fingerprint to open the app"
          theme={theme}
        >
          <Switch
            value={settings.biometricLock}
            onValueChange={(v) => updateSettings({ biometricLock: v })}
            trackColor={{ false: theme.divider, true: theme.primary }}
            thumbColor="#fff"
          />
        </SettingRow>
      </Card>

      {/* About */}
      <SectionHeader title="About" icon="information-outline" theme={theme} />
      <Card style={styles.card}>
        <View style={styles.aboutRow}>
          <View style={[styles.appIcon, { backgroundColor: theme.primary }]}>
            <MaterialCommunityIcons name="view-grid-outline" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1, marginLeft: spacing[3] }}>
            <Label style={{ color: theme.textPrimary }}>LifeHub</Label>
            <Caption style={{ color: theme.textSecondary }}>Version 1.0.0</Caption>
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: theme.divider }]} />
        <Caption style={{ color: theme.textTertiary, lineHeight: 18 }}>
          LifeHub is your personal life admin assistant. Organize bills, documents, and reminders
          all in one secure place.
        </Caption>
      </Card>

      {/* Danger zone */}
      <SectionHeader title="Danger Zone" icon="alert-circle-outline" theme={theme} />
      <Card style={[styles.card, { borderColor: theme.urgent + '40' }]}>
        <TouchableOpacity
          onPress={handleReset}
          style={[styles.optionRow, { paddingVertical: spacing[3] }]}
        >
          <MaterialCommunityIcons name="delete-sweep-outline" size={20} color={theme.urgent} />
          <Body style={{ flex: 1, marginLeft: spacing[3], color: theme.urgent }}>
            Reset All Data
          </Body>
          <MaterialCommunityIcons name="chevron-right" size={20} color={theme.urgent} />
        </TouchableOpacity>
      </Card>

      <View style={{ height: spacing[12] }} />
    </ScrollView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title, icon, theme }: { title: string; icon: string; theme: any }) {
  return (
    <View style={styles.sectionHeader}>
      <MaterialCommunityIcons name={icon as any} size={15} color={theme.textTertiary} />
      <Caption style={[styles.sectionTitle, { color: theme.textTertiary }]}>{title.toUpperCase()}</Caption>
    </View>
  );
}

function SettingRow({
  icon,
  label,
  description,
  theme,
  children,
}: {
  icon: string;
  label: string;
  description?: string;
  theme: any;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.settingRow]}>
      <MaterialCommunityIcons name={icon as any} size={20} color={theme.textSecondary} />
      <View style={{ flex: 1, marginLeft: spacing[3] }}>
        <Label style={{ color: theme.textPrimary }}>{label}</Label>
        {description && (
          <Caption style={{ color: theme.textTertiary, marginTop: 2, lineHeight: 16 }}>
            {description}
          </Caption>
        )}
      </View>
      {children}
    </View>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Label style={{ fontSize: 22, fontWeight: '700', color }}>{value}</Label>
      <Caption style={{ color }}>{label}</Caption>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: spacing[8] },
  header: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[6],
    paddingBottom: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing[4],
  },
  card: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[2],
    paddingTop: spacing[1],
    gap: spacing[2],
  },
  sectionTitle: {
    letterSpacing: 0.8,
    fontSize: 11,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameInput: {
    fontSize: typography.md,
    fontWeight: '600',
    borderBottomWidth: 1.5,
    paddingBottom: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing[3],
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2] + 2,
    paddingHorizontal: spacing[2],
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  aiInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: radius.md,
    padding: spacing[3],
    marginTop: spacing[2],
    gap: spacing[2],
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  appIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
