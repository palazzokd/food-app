import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import type { HouseholdMemberResponse } from '../../types/api';

interface Props {
  member: HouseholdMemberResponse;
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
  adult: { backgroundColor: colors.primaryLight },
  toddler: { backgroundColor: colors.accent },
  infant: { backgroundColor: colors.accentLight },
};

export default function MemberCard({ member }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{member.name}</Text>
        <View style={[styles.badge, badgeColors[member.role]]}>
          <Text style={styles.badgeText}>{roleLabel(member.role)}</Text>
        </View>
      </View>
      {member.age_months !== null && (
        <Text style={styles.detail}>{formatAge(member.age_months)}</Text>
      )}
      {member.dietary_restrictions.length > 0 && (
        <Text style={styles.detail}>
          Restrictions: {member.dietary_restrictions.join(', ')}
        </Text>
      )}
      {member.flavor_preferences.length > 0 && (
        <Text style={styles.detail}>
          Likes: {member.flavor_preferences.join(', ')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textInverse,
  },
  detail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
