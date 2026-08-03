import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useDocumentStore } from '../store/documentStore';
import { Heading3, Body, BodySmall, Label, Caption } from '../components/shared/Typography';
import { Card } from '../components/shared/Card';
import { TagBadge } from '../components/shared/Badge';
import { spacing, radius, typography, CATEGORY_META } from '../constants/theme';
import { format } from 'date-fns';
import { StoredDocument } from '../types';

interface Props {
  document: StoredDocument;
  onClose: () => void;
}

export function DocumentDetailScreen({ document: doc, onClose }: Props) {
  const { theme, isDark } = useTheme();
  const { processWithAI, processingStatus } = useDocumentStore();
  const status = processingStatus[doc.id];
  const isProcessing = status?.status === 'processing';

  const meta = CATEGORY_META[doc.category];
  const bgColor = isDark ? meta.color + '22' : meta.bgColor;

  const handleRunAI = () => {
    processWithAI(doc.id);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.divider }]}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn} hitSlop={8}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Label numberOfLines={1} style={{ fontSize: typography.md, color: theme.textPrimary }}>
            {doc.name}
          </Label>
          <Caption style={{ color: meta.color }}>{meta.label}</Caption>
        </View>
        <View style={[styles.catIcon, { backgroundColor: bgColor }]}>
          <MaterialCommunityIcons name={meta.icon as any} size={22} color={meta.color} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* AI Summary */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="robot-outline" size={18} color={theme.primary} />
            <Label style={[styles.sectionTitle, { color: theme.primary }]}>AI Summary</Label>
            {!doc.aiSummary && (
              <TouchableOpacity
                onPress={handleRunAI}
                disabled={isProcessing}
                style={[styles.runBtn, { backgroundColor: theme.primaryLight }]}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <Caption style={{ color: theme.primary }}>Process</Caption>
                )}
              </TouchableOpacity>
            )}
          </View>
          {doc.aiSummary ? (
            <Body style={{ color: theme.textSecondary, lineHeight: 22, marginTop: spacing[2] }}>
              {doc.aiSummary}
            </Body>
          ) : isProcessing ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={theme.primary} />
              <BodySmall style={{ color: theme.textSecondary, marginLeft: spacing[2] }}>
                Processing document...
              </BodySmall>
            </View>
          ) : (
            <BodySmall style={{ color: theme.textTertiary, marginTop: spacing[2] }}>
              Tap "Process" to extract information using AI.
            </BodySmall>
          )}
        </Card>

        {/* Action Items */}
        {doc.aiActionItems && doc.aiActionItems.length > 0 && (
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={18} color={theme.success} />
              <Label style={[styles.sectionTitle, { color: theme.success }]}>Action Items</Label>
            </View>
            {doc.aiActionItems.map((item, i) => (
              <View key={i} style={styles.actionItem}>
                <View style={[styles.bullet, { backgroundColor: theme.success }]} />
                <Body style={{ color: theme.textPrimary, flex: 1, lineHeight: 22 }}>{item}</Body>
              </View>
            ))}
          </Card>
        )}

        {/* Extracted Dates */}
        {doc.aiExtractedDates && doc.aiExtractedDates.length > 0 && (
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="calendar-check" size={18} color={theme.warning} />
              <Label style={[styles.sectionTitle, { color: theme.warning }]}>Key Dates</Label>
            </View>
            {doc.aiExtractedDates.map((d, i) => (
              <View key={i} style={styles.dateRow}>
                <BodySmall style={{ color: theme.textSecondary, flex: 1 }}>{d.label}</BodySmall>
                <Label style={{ color: theme.textPrimary }}>
                  {format(new Date(d.date), 'MMM d, yyyy')}
                </Label>
              </View>
            ))}
          </Card>
        )}

        {/* Extracted Amounts */}
        {doc.aiExtractedAmounts && doc.aiExtractedAmounts.length > 0 && (
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="currency-usd" size={18} color={theme.primary} />
              <Label style={[styles.sectionTitle, { color: theme.primary }]}>Amounts</Label>
            </View>
            {doc.aiExtractedAmounts.map((a, i) => (
              <View key={i} style={styles.dateRow}>
                <BodySmall style={{ color: theme.textSecondary, flex: 1 }}>{a.label}</BodySmall>
                <Label style={{ color: theme.textPrimary }}>
                  {a.currency} {a.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Label>
              </View>
            ))}
          </Card>
        )}

        {/* Metadata */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="information-outline" size={18} color={theme.textSecondary} />
            <Label style={[styles.sectionTitle, { color: theme.textSecondary }]}>Details</Label>
          </View>
          <View style={styles.dateRow}>
            <BodySmall style={{ color: theme.textSecondary }}>Added</BodySmall>
            <Caption style={{ color: theme.textTertiary }}>
              {format(new Date(doc.createdAt), 'MMMM d, yyyy')}
            </Caption>
          </View>
          {doc.expiryDate && (
            <View style={styles.dateRow}>
              <BodySmall style={{ color: theme.textSecondary }}>Expiry</BodySmall>
              <Caption style={{ color: theme.urgent }}>
                {format(new Date(doc.expiryDate), 'MMMM d, yyyy')}
              </Caption>
            </View>
          )}
          {doc.sizeBytes && (
            <View style={styles.dateRow}>
              <BodySmall style={{ color: theme.textSecondary }}>File size</BodySmall>
              <Caption style={{ color: theme.textTertiary }}>
                {(doc.sizeBytes / 1024).toFixed(0)} KB
              </Caption>
            </View>
          )}
          {doc.notes && (
            <View style={{ marginTop: spacing[2] }}>
              <BodySmall style={{ color: theme.textSecondary, marginBottom: spacing[1] }}>Notes</BodySmall>
              <Body style={{ color: theme.textPrimary, lineHeight: 22 }}>{doc.notes}</Body>
            </View>
          )}
        </Card>

        {/* Tags */}
        {doc.tags && doc.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {doc.tags.map((tag) => (
              <TagBadge key={tag} label={tag} />
            ))}
          </View>
        )}

        <View style={{ height: spacing[10] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing[3],
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  catIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: spacing[4],
    gap: spacing[3],
  },
  section: {
    marginBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  sectionTitle: {
    flex: 1,
    fontSize: typography.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  runBtn: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
    minWidth: 60,
    alignItems: 'center',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[2],
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[1] + 2,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    paddingHorizontal: spacing[1],
  },
});
