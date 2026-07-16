import React, { useCallback, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import MemberCard from '../../components/family/MemberCard';
import { Card, CardTitle } from '../../components/ui';
import PressableScale from '../../components/ui/PressableScale';
import { getProfile } from '../../services/family';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import type { FamilyProfileResponse } from '../../types/api';

export default function FamilyProfileScreen({ navigation }: any) {
  const [profile, setProfile] = useState<FamilyProfileResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const { logout, user } = useAuthStore();

  const loadProfile = async () => {
    setLoading(true);
    setProfile(await getProfile());
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const reviewWithAI = () => {
    navigation.getParent()?.navigate('Chat', {
      initialPrompt:
        "Let's review my family profile together. Show me who you have saved, then go member by member asking about ages, allergies, dietary restrictions, and what each person loves to eat — and update the profile as we go.",
      promptKey: Date.now(),
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadProfile} />}
    >
      <Text style={styles.heading}>{profile?.household_name || 'My Family'}</Text>
      <Text style={styles.subheading}>
        {profile?.members.length ?? 0} member{(profile?.members.length ?? 0) === 1 ? '' : 's'}
      </Text>

      {(profile?.members ?? []).map((member) => (
        <MemberCard
          key={member.id}
          member={member}
          onPress={() => navigation.navigate('MemberEdit', { member })}
        />
      ))}

      <PressableScale
        style={styles.addBtn}
        onPress={() => navigation.navigate('MemberEdit')}
      >
        <Ionicons name="person-add-outline" size={16} color={colors.forest} />
        <Text style={styles.addBtnText}>Add family member</Text>
      </PressableScale>

      <PressableScale style={styles.aiButton} onPress={reviewWithAI}>
        <Ionicons name="sparkles" size={16} color={colors.white} style={{ marginRight: 8 }} />
        <Text style={styles.aiButtonText}>Review & update with AI</Text>
      </PressableScale>

      {profile ? (
        <Card style={styles.constraintsCard}>
          <CardTitle>Cooking Setup</CardTitle>
          {[
            { label: 'Max active prep', value: `${profile.max_prep_minutes} minutes` },
            { label: 'Planning horizon', value: `${profile.planning_horizon_days} days` },
            {
              label: 'Dinners per cycle',
              value: `${profile.dinners_per_cycle} × ${profile.nights_per_dinner} nights each`,
            },
            { label: 'Batch prep day', value: capitalize(profile.batch_prep_day) },
          ].map((row) => (
            <View key={row.label} style={styles.constraintRow}>
              <Text style={styles.constraintLabel}>{row.label}</Text>
              <Text style={styles.constraintValue}>{row.value}</Text>
            </View>
          ))}
          <Text style={styles.constraintHint}>
            Tell the AI to change any of these — e.g. "we can do 45 minute dinners now".
          </Text>
        </Card>
      ) : null}

      <Card>
        <CardTitle>Account</CardTitle>
        <Text style={styles.accountEmail}>{user?.email}</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={16} color={colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  heading: {
    fontFamily: fonts.displayBold,
    fontSize: 24,
    color: colors.forest,
  },
  subheading: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 14,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.forest,
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 10,
  },
  addBtnText: {
    color: colors.forest,
    fontWeight: '600',
    fontSize: 14,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.forest,
    borderRadius: 10,
    paddingVertical: 14,
    marginBottom: 16,
  },
  aiButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  constraintsCard: {
    marginBottom: 16,
  },
  constraintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  constraintLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  constraintValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.charcoal,
  },
  constraintHint: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 10,
    fontStyle: 'italic',
  },
  accountEmail: {
    fontSize: 14,
    color: colors.charcoal,
    marginBottom: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.error,
  },
  logoutText: {
    color: colors.error,
    fontSize: 15,
    fontWeight: '600',
  },
});
