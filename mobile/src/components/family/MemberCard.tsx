import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import PressableScale from '../ui/PressableScale';
import { colors } from '../../theme/colors';
import type { HouseholdMemberResponse } from '../../types/api';

interface Props {
  member: HouseholdMemberResponse;
  onPress?: () => void;
}

function formatAge(ageMonths: number | null): string {
  if (ageMonths === null) return '';
  if (ageMonths >= 24) return `${Math.floor(ageMonths / 12)} years old`;
  return `${ageMonths} months old`;
}

function roleLabel(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

const badgeColors: Record<string, { backgroundColor: string }> = {
  adult: { backgroundColor: colors.sage },
  toddler: { backgroundColor: colors.warm },
  infant: { backgroundColor: colors.accentLight },
};

export default function MemberCard({ member, onPress }: Props) {
  const details: { icon: keyof typeof Ionicons.glyphMap; text: string; alert?: boolean }[] = [];
  if (member.dietary_restrictions.length > 0) {
    details.push({
      icon: 'alert-circle-outline',
      text: member.dietary_restrictions.join(', '),
      alert: true,
    });
  }
  if (member.flavor_preferences.length > 0) {
    details.push({ icon: 'heart-outline', text: member.flavor_preferences.join(', ') });
  }
  if (member.texture_preferences.length > 0) {
    details.push({ icon: 'hand-left-outline', text: member.texture_preferences.join(', ') });
  }
  if (member.role === 'infant' && member.allergens_introduced.length > 0) {
    details.push({
      icon: 'shield-checkmark-outline',
      text: `Introduced: ${member.allergens_introduced.join(', ')}`,
    });
  }

  return (
    <PressableScale style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.nameWrap}>
          <Text style={styles.name}>{member.name}</Text>
          {member.age_months !== null ? (
            <Text style={styles.age}>{formatAge(member.age_months)}</Text>
          ) : null}
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.badge, badgeColors[member.role]]}>
            <Text style={styles.badgeText}>{roleLabel(member.role)}</Text>
          </View>
          {onPress ? (
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          ) : null}
        </View>
      </View>
      {details.map((d, i) => (
        <View key={i} style={styles.detailRow}>
          <Ionicons
            name={d.icon}
            size={13}
            color={d.alert ? colors.error : colors.sage}
            style={styles.detailIcon}
          />
          <Text style={[styles.detail, d.alert && styles.detailAlert]}>{d.text}</Text>
        </View>
      ))}
      {details.length === 0 ? (
        <Text style={styles.emptyDetail}>No preferences saved yet — tap to add</Text>
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  nameWrap: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.charcoal,
  },
  age: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  detailIcon: {
    marginRight: 6,
  },
  detail: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  detailAlert: {
    color: colors.error,
    fontWeight: '600',
  },
  emptyDetail: {
    fontSize: 12,
    color: colors.placeholder,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
