import React, { useCallback, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { Card, CardTitle, EmptyState } from '../../components/ui';
import {
  createTrustedSource,
  deleteTrustedSource,
  fetchTrustedSources,
} from '../../services/modules';
import { colors } from '../../theme/colors';
import type { TrustedSource } from '../../types/api';

export default function RecipeSourcesScreen() {
  const [sources, setSources] = useState<TrustedSource[]>([]);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setSources(await fetchTrustedSources());
    } catch {
      // no profile yet
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const add = async () => {
    if (!name.trim() || !url.trim()) return;
    setSaving(true);
    try {
      let cleanUrl = url.trim();
      if (!cleanUrl.startsWith('http')) cleanUrl = `https://${cleanUrl}`;
      await createTrustedSource({
        name: name.trim(),
        url: cleanUrl,
        notes: notes.trim() || null,
      });
      setName('');
      setUrl('');
      setNotes('');
      await load();
    } catch (e: any) {
      Alert.alert('Could not save', e.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmRemove = (source: TrustedSource) => {
    Alert.alert('Remove source', `Remove ${source.name} from your trusted sites?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await deleteTrustedSource(source.id);
          await load();
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.blurb}>
        Sites you love getting recipes from. The AI searches these first when you ask it to
        find recipes online, and credits them on anything it saves.
      </Text>

      {sources.map((source) => (
        <Card key={source.id} style={styles.sourceCard}>
          <View style={styles.sourceRow}>
            <Ionicons name="globe-outline" size={18} color={colors.sage} />
            <View style={styles.sourceText}>
              <Text style={styles.sourceName}>{source.name}</Text>
              <Text style={styles.sourceUrl}>{source.url}</Text>
              {source.notes ? <Text style={styles.sourceNotes}>{source.notes}</Text> : null}
            </View>
            <TouchableOpacity
              onPress={() => confirmRemove(source)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash-outline" size={17} color={colors.error} />
            </TouchableOpacity>
          </View>
        </Card>
      ))}

      {sources.length === 0 ? (
        <EmptyState
          emoji="🌐"
          message="No trusted sites yet — add your favorite recipe blogs below, or just mention them to the AI in chat."
        />
      ) : null}

      <Card>
        <CardTitle>Add a site</CardTitle>
        <TextInput
          style={styles.input}
          placeholder="Site name, e.g. Half Baked Harvest"
          placeholderTextColor={colors.placeholder}
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="URL, e.g. halfbakedharvest.com"
          placeholderTextColor={colors.placeholder}
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          keyboardType="url"
        />
        <TextInput
          style={styles.input}
          placeholder="What you like from it (optional)"
          placeholderTextColor={colors.placeholder}
          value={notes}
          onChangeText={setNotes}
        />
        <TouchableOpacity
          style={[styles.addBtn, (!name.trim() || !url.trim()) && styles.addBtnDisabled]}
          onPress={add}
          disabled={saving || !name.trim() || !url.trim()}
        >
          <Text style={styles.addBtnText}>{saving ? 'Saving…' : 'Add source'}</Text>
        </TouchableOpacity>
      </Card>
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
  blurb: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 14,
  },
  sourceCard: {
    marginBottom: 10,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  sourceText: {
    flex: 1,
  },
  sourceName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.charcoal,
  },
  sourceUrl: {
    fontSize: 12,
    color: colors.sage,
    marginTop: 1,
  },
  sourceNotes: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: colors.charcoal,
    marginBottom: 10,
  },
  addBtn: {
    backgroundColor: colors.forest,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  addBtnDisabled: {
    backgroundColor: colors.border,
  },
  addBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
