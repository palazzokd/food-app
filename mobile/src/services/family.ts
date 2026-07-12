import { apiFetch } from './api';
import type { FamilyProfileResponse, ConversationResponse } from '../types/api';

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
