export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  quizOptions?: QuizOptions;
}

export interface QuizOption {
  id: string;
  label: string;
}

export interface QuizOptions {
  question: string;
  options: QuizOption[];
  allowMultiple: boolean;
}

// WebSocket message types
export interface WSMessage {
  type: 'message' | 'quiz_response';
  content: string;
  option_id?: string;
}

export interface WSEvent {
  type: 'connected' | 'stream_start' | 'stream_chunk' | 'stream_end' | 'quiz_options' | 'tool_status' | 'error';
  content?: string;
  message?: string;
  conversation_id?: string;
  question?: string;
  options?: QuizOption[];
  allow_multiple?: boolean;
  tool?: string;
  status?: string;
}
