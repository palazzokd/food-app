import { apiFetch } from './api';
import type { FamilyProfileResponse, ConversationResponse, HouseholdMemberResponse } from '../types/api';

export async function getProfile(): Promise<FamilyProfileResponse | null> {
  try {
    const response = await apiFetch('/api/family/profile');
    return response.json();
  } catch {
    return null;
  }
}

export async function createConversation(title?: string): Promise<ConversationResponse> {
  const response = await apiFetch('/api/chat/conversations', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
  return response.json();
}

export async function listConversations(): Promise<ConversationResponse[]> {
  const response = await apiFetch('/api/chat/conversations');
  return response.json();
}

export interface MemberPayload {
  name: string;
  age_months: number | null;
  role: 'adult' | 'toddler' | 'infant';
  nutritional_stage: 'adult' | 'palate_expansion' | 'allergen_introduction';
  dietary_restrictions: string[];
  flavor_preferences: string[];
  texture_preferences: string[];
  allergens_introduced: string[];
}

export async function addMember(data: MemberPayload): Promise<HouseholdMemberResponse> {
  const response = await apiFetch('/api/family/members', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function updateMember(
  memberId: string,
  data: Partial<MemberPayload>
): Promise<HouseholdMemberResponse> {
  const response = await apiFetch(`/api/family/members/${memberId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function deleteMember(memberId: string): Promise<void> {
  await apiFetch(`/api/family/members/${memberId}`, { method: 'DELETE' });
}
