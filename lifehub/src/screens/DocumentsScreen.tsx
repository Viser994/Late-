import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useDocumentStore } from '../store/documentStore';
import { DocumentCard } from '../components/documents/DocumentCard';
import { CategoryFilter } from '../components/documents/CategoryFilter';
import { AddDocumentSheet } from '../components/documents/AddDocumentSheet';
import { DocumentDetailScreen } from './DocumentDetailScreen';
import { EmptyState } from '../components/shared/EmptyState';
import { Heading3, BodySmall } from '../components/shared/Typography';
import { spacing, radius, typography } from '../constants/theme';
import { DocumentCategory, StoredDocument } from '../types';

export function DocumentsScreen() {
  const { theme } = useTheme();
  const { documents, loadDocuments } = useDocumentStore();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | 'all'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<StoredDocument | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    let result = documents;
    if (categoryFilter !== 'all') {
      result = result.filter((d) => d.category === categoryFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.aiSummary?.toLowerCase().includes(q) ||
          d.tags?.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [documents, categoryFilter, search]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDocuments();
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.divider }]}>
        <View>
          <BodySmall style={{ color: theme.textSecondary }}>{documents.length} documents stored</BodySmall>
          <Heading3 style={{ color: theme.textPrimary, marginTop: 2 }}>My Documents</Heading3>
        </View>
        <TouchableOpacity
          onPress={() => setShowAdd(true)}
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchRow, { backgroundColor: theme.surface }]}>
        <View style={[styles.searchBox, { backgroundColor: theme.surfaceMuted, borderColor: theme.cardBorder }]}>
          <MaterialCommunityIcons name="magnify" size={18} color={theme.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Search documents..."
            placeholderTextColor={theme.textTertiary}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <MaterialCommunityIcons name="close-circle" size={16} color={theme.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category filter */}
      <CategoryFilter selected={categoryFilter} onSelect={setCategoryFilter} />

      {/* Document list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary} />
        }
        renderItem={({ item }) => (
          <DocumentCard document={item} onPress={setSelectedDoc} />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="folder-open-outline"
            title={search ? 'No results found' : 'No documents yet'}
            description={
              search
                ? `No documents match "${search}". Try a different search.`
                : 'Upload IDs, insurance cards, receipts, or warranties and let AI organize them for you.'
            }
            actionLabel={!search ? 'Add Document' : undefined}
            onAction={!search ? () => setShowAdd(true) : undefined}
          />
        }
      />

      <AddDocumentSheet visible={showAdd} onClose={() => setShowAdd(false)} />

      {/* Document Detail Modal */}
      <Modal
        visible={!!selectedDoc}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedDoc(null)}
      >
        {selectedDoc && (
          <DocumentDetailScreen
            document={selectedDoc}
            onClose={() => setSelectedDoc(null)}
          />
        )}
      </Modal>
    </View>
  );
}

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
  searchRow: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2] + 2,
    gap: spacing[2],
  },
  searchInput: {
    flex: 1,
    fontSize: typography.base,
    padding: 0,
  },
  list: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[12],
  },
});
