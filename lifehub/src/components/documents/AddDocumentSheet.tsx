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
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../hooks/useTheme';
import { useDocumentStore } from '../../store/documentStore';
import { Button } from '../shared/Button';
import { Label, Body, BodySmall, Caption } from '../shared/Typography';
import { radius, spacing, typography, CATEGORY_META } from '../../constants/theme';
import { DocumentCategory } from '../../types';

interface AddDocumentSheetProps {
  visible: boolean;
  onClose: () => void;
}

const CATEGORIES: DocumentCategory[] = [
  'identity', 'insurance', 'warranty', 'medical', 'finance', 'travel', 'receipt', 'other',
];

export function AddDocumentSheet({ visible, onClose }: AddDocumentSheetProps) {
  const { theme } = useTheme();
  const { addDocument, processWithAI } = useDocumentStore();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('other');
  const [notes, setNotes] = useState('');
  const [pickedFile, setPickedFile] = useState<{
    uri: string;
    name: string;
    mimeType: string;
    size?: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const reset = () => {
    setName('');
    setCategory('other');
    setNotes('');
    setPickedFile(null);
    setIsLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        setPickedFile({
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType ?? 'application/octet-stream',
          size: asset.size,
        });
        if (!name) setName(asset.name.replace(/\.[^/.]+$/, ''));
      }
    } catch {
      Alert.alert('Error', 'Could not pick document.');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera access is needed to scan documents.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setPickedFile({
        uri: asset.uri,
        name: `scan_${Date.now()}.jpg`,
        mimeType: 'image/jpeg',
        size: undefined,
      });
      if (!name) setName(`Scan ${new Date().toLocaleDateString()}`);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a document name.');
      return;
    }

    setIsLoading(true);
    try {
      const doc = await addDocument({
        name: name.trim(),
        category,
        uri: pickedFile?.uri ?? 'file://placeholder',
        mimeType: pickedFile?.mimeType ?? 'application/octet-stream',
        sizeBytes: pickedFile?.size,
        notes: notes.trim() || undefined,
        tags: [category],
      });

      // Run AI processing in the background
      processWithAI(doc.id).catch(() => null);

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
          <Label style={{ fontSize: typography.md }}>Add Document</Label>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {/* File picker area */}
          {pickedFile ? (
            <View style={[styles.filePreview, { backgroundColor: theme.successLight, borderColor: theme.success }]}>
              <MaterialCommunityIcons name="file-check" size={28} color={theme.success} />
              <View style={{ flex: 1, marginLeft: spacing[3] }}>
                <Label numberOfLines={1} style={{ color: theme.success }}>{pickedFile.name}</Label>
                {pickedFile.size && (
                  <Caption style={{ color: theme.success }}>
                    {(pickedFile.size / 1024).toFixed(0)} KB
                  </Caption>
                )}
              </View>
              <TouchableOpacity onPress={() => setPickedFile(null)} hitSlop={8}>
                <MaterialCommunityIcons name="close-circle" size={20} color={theme.success} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.pickRow}>
              <TouchableOpacity
                onPress={pickDocument}
                style={[styles.pickBtn, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}
              >
                <MaterialCommunityIcons name="file-upload-outline" size={24} color={theme.primary} />
                <Text style={[styles.pickLabel, { color: theme.primary }]}>Upload File</Text>
                <Caption style={{ color: theme.primary }}>PDF or image</Caption>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={takePhoto}
                style={[styles.pickBtn, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}
              >
                <MaterialCommunityIcons name="camera-outline" size={24} color={theme.primary} />
                <Text style={[styles.pickLabel, { color: theme.primary }]}>Scan</Text>
                <Caption style={{ color: theme.primary }}>Take a photo</Caption>
              </TouchableOpacity>
            </View>
          )}

          {/* Name */}
          <BodySmall style={[styles.fieldLabel, { color: theme.textSecondary }]}>Name *</BodySmall>
          <TextInput
            style={inputStyle}
            placeholder="e.g. Car Insurance Policy"
            placeholderTextColor={theme.textTertiary}
            value={name}
            onChangeText={setName}
            returnKeyType="next"
          />

          {/* Category */}
          <BodySmall style={[styles.fieldLabel, { color: theme.textSecondary }]}>Category</BodySmall>
          <View style={[styles.chipGrid, { marginBottom: spacing[4] }]}>
            {CATEGORIES.map((cat) => {
              const meta = CATEGORY_META[cat];
              const active = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
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
                    size={13}
                    color={active ? '#fff' : meta.color}
                  />
                  <Text style={[styles.chipText, { color: active ? '#fff' : theme.textSecondary }]}>
                    {meta.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Notes */}
          <BodySmall style={[styles.fieldLabel, { color: theme.textSecondary }]}>Notes</BodySmall>
          <TextInput
            style={[inputStyle, styles.multiline]}
            placeholder="Optional notes about this document..."
            placeholderTextColor={theme.textTertiary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />

          {/* AI note */}
          <View style={[styles.aiNote, { backgroundColor: theme.primaryLight }]}>
            <MaterialCommunityIcons name="robot-outline" size={16} color={theme.primary} />
            <Caption style={{ color: theme.primary, flex: 1, marginLeft: spacing[2] }}>
              AI will automatically extract dates, amounts, and action items after saving.
            </Caption>
          </View>

          <View style={{ height: spacing[8] }} />
        </ScrollView>

        {/* Save */}
        <View style={[styles.footer, { borderTopColor: theme.divider, backgroundColor: theme.surface }]}>
          <Button
            title="Save Document"
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
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    padding: spacing[3] + 2,
    marginBottom: spacing[4],
  },
  pickRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  pickBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    paddingVertical: spacing[4],
    gap: spacing[1],
  },
  pickLabel: {
    fontSize: typography.sm,
    fontWeight: typography.weight.semibold,
    marginTop: spacing[1],
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
  chipGrid: {
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
  aiNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: radius.md,
    padding: spacing[3],
    marginBottom: spacing[4],
  },
  footer: {
    padding: spacing[5],
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
