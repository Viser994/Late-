import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StoredDocument } from '../../types';
import { useTheme } from '../../hooks/useTheme';
import { useDocumentStore } from '../../store/documentStore';
import { Label, BodySmall, Caption } from '../shared/Typography';
import { radius, spacing, typography, CATEGORY_META } from '../../constants/theme';
import { format, isPast } from 'date-fns';

interface DocumentCardProps {
  document: StoredDocument;
  onPress: (doc: StoredDocument) => void;
}

export function DocumentCard({ document: doc, onPress }: DocumentCardProps) {
  const { theme, isDark } = useTheme();
  const { deleteDocument } = useDocumentStore();

  const meta = CATEGORY_META[doc.category];
  const isExpiringSoon = doc.expiryDate
    ? new Date(doc.expiryDate).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000
    : false;
  const isExpired = doc.expiryDate ? isPast(new Date(doc.expiryDate)) : false;

  const handleDelete = () => {
    Alert.alert('Remove Document', `Remove "${doc.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteDocument(doc.id) },
    ]);
  };

  const bgColor = isDark ? meta.color + '22' : meta.bgColor;

  return (
    <TouchableOpacity
      onPress={() => onPress(doc)}
      activeOpacity={0.85}
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: isExpired
            ? theme.urgent
            : isExpiringSoon
            ? theme.warning
            : theme.cardBorder,
          borderWidth: isExpired || isExpiringSoon ? 1.5 : StyleSheet.hairlineWidth,
        },
      ]}
    >
      {/* Category icon */}
      <View style={[styles.iconWrap, { backgroundColor: bgColor }]}>
        <MaterialCommunityIcons name={meta.icon as any} size={24} color={meta.color} />
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Label numberOfLines={1} style={{ color: theme.textPrimary }}>
          {doc.name}
        </Label>
        <Caption style={{ color: meta.color, marginTop: 2 }}>{meta.label}</Caption>

        {doc.aiSummary ? (
          <BodySmall numberOfLines={2} style={[styles.summary, { color: theme.textSecondary }]}>
            {doc.aiSummary}
          </BodySmall>
        ) : null}

        <View style={styles.footer}>
          {doc.expiryDate ? (
            <View style={styles.expiryRow}>
              <MaterialCommunityIcons
                name={isExpired ? 'clock-remove' : 'clock-outline'}
                size={11}
                color={isExpired ? theme.urgent : isExpiringSoon ? theme.warning : theme.textTertiary}
              />
              <Caption
                style={{
                  color: isExpired
                    ? theme.urgent
                    : isExpiringSoon
                    ? theme.warning
                    : theme.textTertiary,
                  marginLeft: 3,
                }}
              >
                {isExpired ? 'Expired' : 'Expires'}{' '}
                {format(new Date(doc.expiryDate), 'MMM d, yyyy')}
              </Caption>
            </View>
          ) : (
            <Caption style={{ color: theme.textTertiary }}>
              Added {format(new Date(doc.createdAt), 'MMM d, yyyy')}
            </Caption>
          )}
        </View>
      </View>

      {/* Delete */}
      <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn} hitSlop={8}>
        <MaterialCommunityIcons name="dots-vertical" size={20} color={theme.textTertiary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: radius.lg,
    padding: spacing[3] + 2,
    marginBottom: spacing[2] + 2,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  info: {
    flex: 1,
    marginRight: spacing[1],
  },
  summary: {
    marginTop: spacing[1],
    lineHeight: 18,
  },
  footer: {
    marginTop: spacing[2],
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteBtn: {
    padding: 4,
    marginTop: -2,
  },
});
