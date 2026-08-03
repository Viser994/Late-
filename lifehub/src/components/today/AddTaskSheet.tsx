import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Text,
  Modal,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../hooks/useTheme';
import { useTaskStore } from '../../store/taskStore';
import { Button } from '../shared/Button';
import { Label, Body, BodySmall } from '../shared/Typography';
import {
  radius,
  spacing,
  typography,
  REMINDER_TYPE_META,
} from '../../constants/theme';
import { Priority, ReminderType } from '../../types';
import { format } from 'date-fns';

interface AddTaskSheetProps {
  visible: boolean;
  onClose: () => void;
}

const TYPES: ReminderType[] = ['task', 'bill', 'appointment', 'renewal', 'custom'];
const PRIORITIES: Priority[] = ['urgent', 'high', 'normal', 'low'];

const PRIORITY_COLORS: Record<Priority, string> = {
  urgent: '#EF4444',
  high: '#F59E0B',
  normal: '#6366F1',
  low: '#9CA3AF',
};

export function AddTaskSheet({ visible, onClose }: AddTaskSheetProps) {
  const { theme } = useTheme();
  const { addTask } = useTaskStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ReminderType>('task');
  const [priority, setPriority] = useState<Priority>('normal');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const reset = () => {
    setTitle('');
    setDescription('');
    setType('task');
    setPriority('normal');
    setDueDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
    setAmount('');
    setShowDatePicker(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a title.');
      return;
    }
    setIsLoading(true);
    try {
      await addTask({
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        priority,
        status: 'pending',
        dueDate: dueDate.toISOString(),
        amount: amount ? parseFloat(amount) : undefined,
        currency: amount ? 'USD' : undefined,
        tags: [type],
      });
      handleClose();
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = [
    styles.input,
    {
      backgroundColor: theme.surfaceMuted,
      color: theme.textPrimary,
      borderColor: theme.cardBorder,
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: theme.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.divider }]}>
          <TouchableOpacity onPress={handleClose} hitSlop={8}>
            <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
          <Label style={{ fontSize: typography.md }}>New Reminder</Label>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {/* Title */}
          <BodySmall style={[styles.fieldLabel, { color: theme.textSecondary }]}>Title *</BodySmall>
          <TextInput
            style={inputStyle}
            placeholder="e.g. Pay electricity bill"
            placeholderTextColor={theme.textTertiary}
            value={title}
            onChangeText={setTitle}
            autoFocus
            returnKeyType="next"
          />

          {/* Description */}
          <BodySmall style={[styles.fieldLabel, { color: theme.textSecondary }]}>Notes</BodySmall>
          <TextInput
            style={[inputStyle, styles.multiline]}
            placeholder="Optional details..."
            placeholderTextColor={theme.textTertiary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />

          {/* Type */}
          <BodySmall style={[styles.fieldLabel, { color: theme.textSecondary }]}>Type</BodySmall>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing[4] }}>
            <View style={styles.chipRow}>
              {TYPES.map((t) => {
                const meta = REMINDER_TYPE_META[t];
                const active = type === t;
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setType(t)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? meta.color : theme.surfaceMuted,
                        borderColor: active ? meta.color : theme.cardBorder,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={meta.icon as any}
                      size={14}
                      color={active ? '#fff' : meta.color}
                    />
                    <Text style={[styles.chipText, { color: active ? '#fff' : theme.textSecondary }]}>
                      {meta.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Priority */}
          <BodySmall style={[styles.fieldLabel, { color: theme.textSecondary }]}>Priority</BodySmall>
          <View style={[styles.chipRow, { marginBottom: spacing[4] }]}>
            {PRIORITIES.map((p) => {
              const active = priority === p;
              const color = PRIORITY_COLORS[p];
              return (
                <TouchableOpacity
                  key={p}
                  onPress={() => setPriority(p)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? color : theme.surfaceMuted,
                      borderColor: active ? color : theme.cardBorder,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: active ? '#fff' : theme.textSecondary }]}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Due Date */}
          <BodySmall style={[styles.fieldLabel, { color: theme.textSecondary }]}>Due Date</BodySmall>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={[styles.dateBtn, { backgroundColor: theme.surfaceMuted, borderColor: theme.cardBorder }]}
          >
            <MaterialCommunityIcons name="calendar" size={18} color={theme.primary} />
            <Body style={{ color: theme.textPrimary, marginLeft: spacing[2] }}>
              {format(dueDate, 'EEEE, MMMM d, yyyy')}
            </Body>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={dueDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              minimumDate={new Date()}
              onChange={(_, date) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (date) setDueDate(date);
              }}
              style={{ marginBottom: spacing[4] }}
            />
          )}

          {/* Amount (for bills) */}
          {(type === 'bill' || type === 'renewal') && (
            <>
              <BodySmall style={[styles.fieldLabel, { color: theme.textSecondary }]}>Amount (USD)</BodySmall>
              <View style={styles.amountRow}>
                <Text style={[styles.currencySymbol, { color: theme.textSecondary }]}>$</Text>
                <TextInput
                  style={[inputStyle, styles.amountInput]}
                  placeholder="0.00"
                  placeholderTextColor={theme.textTertiary}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                />
              </View>
            </>
          )}

          <View style={{ height: spacing[8] }} />
        </ScrollView>

        {/* Save */}
        <View style={[styles.footer, { borderTopColor: theme.divider, backgroundColor: theme.surface }]}>
          <Button
            title="Save Reminder"
            onPress={handleSave}
            loading={isLoading}
            fullWidth
            size="lg"
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  body: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
  },
  fieldLabel: {
    marginBottom: spacing[1] + 2,
    fontWeight: typography.weight.medium,
  },
  input: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing[3] + 2,
    paddingVertical: spacing[3],
    fontSize: typography.base,
    marginBottom: spacing[4],
  },
  multiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1] + 3,
    borderRadius: radius.full,
    borderWidth: 1,
    gap: 5,
  },
  chipText: {
    fontSize: typography.xs,
    fontWeight: typography.weight.semibold,
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing[3] + 2,
    paddingVertical: spacing[3],
    marginBottom: spacing[4],
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  currencySymbol: {
    fontSize: typography.md,
    fontWeight: typography.weight.semibold,
    marginRight: spacing[2],
  },
  amountInput: {
    flex: 1,
    marginBottom: 0,
  },
  footer: {
    padding: spacing[5],
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
