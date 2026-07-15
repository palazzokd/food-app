import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import ChipInput from '../../components/family/ChipInput';
import { addMember, deleteMember, updateMember } from '../../services/family';
import { colors } from '../../theme/colors';
import type { HouseholdMemberResponse } from '../../types/api';

type Role = 'adult' | 'toddler' | 'infant';

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'adult', label: 'Adult' },
  { value: 'toddler', label: 'Toddler' },
  { value: 'infant', label: 'Infant' },
];

const STAGE_FOR_ROLE: Record<Role, 'adult' | 'palate_expansion' | 'allergen_introduction'> = {
  adult: 'adult',
  toddler: 'palate_expansion',
  infant: 'allergen_introduction',
};

export default function MemberEditScreen({ navigation, route }: any) {
  const existing: HouseholdMemberResponse | undefined = route.params?.member;

  const [name, setName] = useState(existing?.name ?? '');
  const [role, setRole] = useState<Role>(existing?.role ?? 'adult');
  const [ageText, setAgeText] = useState(
    existing?.age_months != null
      ? existing.age_months >= 24
        ? String(Math.floor(existing.age_months / 12))
        : String(existing.age_months)
      : ''
  );
  const [ageUnit, setAgeUnit] = useState<'years' | 'months'>(
    existing?.age_months != null && existing.age_months < 24 ? 'months' : 'years'
  );
  const [restrictions, setRestrictions] = useState<string[]>(
    existing?.dietary_restrictions ?? []
  );
  const [likes, setLikes] = useState<string[]>(existing?.flavor_preferences ?? []);
  const [textures, setTextures] = useState<string[]>(existing?.texture_preferences ?? []);
  const [allergens, setAllergens] = useState<string[]>(existing?.allergens_introduced ?? []);
  const [saving, setSaving] = useState(false);

  const ageMonths = (): number | null => {
    const n = parseInt(ageText, 10);
    if (isNaN(n) || n <= 0) return null;
    return ageUnit === 'years' ? n * 12 : n;
  };

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter a name for this family member.');
      return;
    }
    setSaving(true);
    const payload = {
      name: name.trim(),
      age_months: ageMonths(),
      role,
      nutritional_stage: STAGE_FOR_ROLE[role],
      dietary_restrictions: restrictions,
      flavor_preferences: likes,
      texture_preferences: textures,
      allergens_introduced: allergens,
    };
    try {
      if (existing) {
        await updateMember(existing.id, payload);
      } else {
        await addMember(payload);
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
    Alert.alert('Remove member', `Remove ${existing.name} from your family profile?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMember(existing.id);
            navigation.goBack();
          } catch (e: any) {
            Alert.alert('Delete failed', e.message);
          }
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
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
          placeholder="e.g. Lucas"
          placeholderTextColor={colors.placeholder}
        />

        <Text style={styles.fieldLabel}>Role</Text>
        <View style={styles.segments}>
          {ROLE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.segment, role === opt.value && styles.segmentActive]}
              onPress={() => setRole(opt.value)}
            >
              <Text style={role === opt.value ? styles.segmentTextActive : styles.segmentText}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Age (optional)</Text>
        <View style={styles.ageRow}>
          <TextInput
            style={[styles.input, styles.ageInput]}
            value={ageText}
            onChangeText={setAgeText}
            keyboardType="number-pad"
            placeholder="—"
            placeholderTextColor={colors.placeholder}
          />
          <View style={styles.segments}>
            {(['years', 'months'] as const).map((unit) => (
              <TouchableOpacity
                key={unit}
                style={[styles.segment, ageUnit === unit && styles.segmentActive]}
                onPress={() => setAgeUnit(unit)}
              >
                <Text style={ageUnit === unit ? styles.segmentTextActive : styles.segmentText}>
                  {unit}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <ChipInput
          label="Allergies & dietary restrictions"
          values={restrictions}
          onChange={setRestrictions}
          placeholder="e.g. peanuts, gluten-free"
        />
        <ChipInput
          label="Loves to eat"
          values={likes}
          onChange={setLikes}
          placeholder="e.g. runny eggs, mango"
        />
        {role !== 'adult' ? (
          <ChipInput
            label="Texture preferences"
            values={textures}
            onChange={setTextures}
            placeholder="e.g. soft, no mushy food"
          />
        ) : null}
        {role === 'infant' ? (
          <ChipInput
            label="Allergens already introduced"
            values={allergens}
            onChange={setAllergens}
            placeholder="e.g. peanut, egg"
          />
        ) : null}

        <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
          <Text style={styles.saveBtnText}>
            {saving ? 'Saving…' : existing ? 'Save changes' : 'Add family member'}
          </Text>
        </TouchableOpacity>

        {existing ? (
          <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete}>
            <Text style={styles.deleteBtnText}>Remove from family</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
  segments: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  segment: {
    borderWidth: 1.5,
    borderColor: colors.forest,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  segmentActive: {
    backgroundColor: colors.forest,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.forest,
  },
  segmentTextActive: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
  ageRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  ageInput: {
    width: 80,
    textAlign: 'center',
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
