import { create } from 'zustand';
import type { ChatMessage, QuizOptions, SavedContentInfo } from '../types/chat';

interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  currentStreamText: string;
  activeQuiz: QuizOptions | null;

  addUserMessage: (content: string) => void;
  addSavedContentCard: (info: SavedContentInfo) => void;
  startStream: () => void;
  appendStreamChunk: (chunk: string) => void;
  endStream: () => void;
  setQuizOptions: (quiz: QuizOptions) => void;
  clearQuiz: () => void;
  clearMessages: () => void;
}

let messageCounter = 0;

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isStreaming: false,
  currentStreamText: '',
  activeQuiz: null,

  addUserMessage: (content) => {
    const msg: ChatMessage = {
      id: `user-${++messageCounter}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    set((state) => ({ messages: [...state.messages, msg] }));
  },

  addSavedContentCard: (info) => {
    const state = get();
    // Flush any streamed text so the card lands in reading order
    if (state.currentStreamText) {
      const msg: ChatMessage = {
        id: `ai-${++messageCounter}`,
        role: 'assistant',
        content: state.currentStreamText,
        timestamp: new Date(),
      };
      set((s) => ({ messages: [...s.messages, msg], currentStreamText: '' }));
    }
    const card: ChatMessage = {
      id: `saved-${++messageCounter}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      savedContent: info,
    };
    set((s) => ({ messages: [...s.messages, card] }));
  },

  startStream: () => {
    set({ isStreaming: true, currentStreamText: '' });
  },

  appendStreamChunk: (chunk) => {
    set((state) => {
      const newText = state.currentStreamText + chunk;
      return { currentStreamText: newText };
    });
  },

  endStream: () => {
    const { currentStreamText } = get();
    if (currentStreamText) {
      const msg: ChatMessage = {
        id: `ai-${++messageCounter}`,
        role: 'assistant',
        content: currentStreamText,
        timestamp: new Date(),
      };
      set((state) => ({
        messages: [...state.messages, msg],
        isStreaming: false,
        currentStreamText: '',
      }));
    } else {
      set({ isStreaming: false, currentStreamText: '' });
    }
  },

  setQuizOptions: (quiz) => {
    set({ activeQuiz: quiz });
  },

  clearQuiz: () => {
    set({ activeQuiz: null });
  },

  clearMessages: () => {
    set({ messages: [], isStreaming: false, currentStreamText: '', activeQuiz: null });
  },
}));
