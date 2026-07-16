import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';

import {
  createNutritionTarget,
  deleteNutritionTarget,
  updateNutritionTarget,
} from '../../services/modules';
import { colors } from '../../theme/colors';
import type { NutritionTarget } from '../../types/api';

export default function TargetEditScreen({ navigation, route }: any) {
  const existing: NutritionTarget | undefined = route.params?.target;

  const [name, setName] = useState(existing?.name ?? '');
  const [emoji, setEmoji] = useState(existing?.emoji ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [examples, setExamples] = useState(existing?.examples ?? '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Give this target a short name, e.g. "Protein".');
      return;
    }
    setSaving(true);
    const payload = {
      name: name.trim(),
      emoji: emoji.trim() || null,
      description: description.trim() || null,
      examples: examples.trim() || null,
    };
    try {
      if (existing) {
        await updateNutritionTarget(existing.id, payload);
      } else {
        await createNutritionTarget(payload);
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Save failed', e.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!existing) return;
    Alert.alert(
      'Delete target',
      `Delete "${existing.name}"? Its check-off history will be removed too.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNutritionTarget(existing.id);
              navigation.goBack();
            } catch (e: any) {
              Alert.alert('Delete failed', e.message);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.fieldLabel}>Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Protein"
        placeholderTextColor={colors.placeholder}
      />

      <Text style={styles.fieldLabel}>Emoji (optional)</Text>
      <TextInput
        style={[styles.input, styles.emojiInput]}
        value={emoji}
        onChangeText={setEmoji}
        placeholder="🎯"
        placeholderTextColor={colors.placeholder}
        maxLength={4}
      />

      <Text style={styles.fieldLabel}>Goal (optional)</Text>
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        placeholder="e.g. 30g per meal"
        placeholderTextColor={colors.placeholder}
      />

      <Text style={styles.fieldLabel}>Examples (optional)</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={examples}
        onChangeText={setExamples}
        placeholder="e.g. Chicken, eggs, Greek yogurt, tofu"
        placeholderTextColor={colors.placeholder}
        multiline
      />

      <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
        <Text style={styles.saveBtnText}>
          {saving ? 'Saving…' : existing ? 'Save changes' : 'Add target'}
        </Text>
      </TouchableOpacity>

      {existing ? (
        <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete}>
          <Text style={styles.deleteBtnText}>Delete target</Text>
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  content: {
    padding: 16,
    paddingBottom: 60,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.forest,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.charcoal,
    marginBottom: 18,
  },
  emojiInput: {
    width: 80,
    textAlign: 'center',
    fontSize: 20,
  },
  multiline: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: colors.forest,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  deleteBtn: {
    borderWidth: 1.5,
    borderColor: colors.error,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  deleteBtnText: {
    color: colors.error,
    fontWeight: '600',
    fontSize: 14,
  },
});
