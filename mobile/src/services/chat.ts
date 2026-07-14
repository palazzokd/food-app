import { getAccessToken, getWsUrl } from './api';
import type { WSEvent } from '../types/chat';

type EventHandler = (event: WSEvent) => void;

export class ChatWebSocket {
  private ws: WebSocket | null = null;
  private conversationId: string;
  private onEvent: EventHandler;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(conversationId: string, onEvent: EventHandler) {
    this.conversationId = conversationId;
    this.onEvent = onEvent;
  }

  connect() {
    const token = getAccessToken();
    const url = getWsUrl(`/api/chat/ws/${this.conversationId}?token=${token}`);
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const data: WSEvent = JSON.parse(event.data);
        this.onEvent(data);
      } catch {
        // Ignore parse errors
      }
    };

    this.ws.onclose = () => {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => this.connect(), 1000 * this.reconnectAttempts);
      }
    };

    this.ws.onerror = () => {
      // Will trigger onclose
    };
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  sendMessage(content: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'message', content }));
    }
  }

  sendQuizResponse(optionId: string, label: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({ type: 'quiz_response', option_id: optionId, content: label })
      );
    }
  }

  disconnect() {
    this.maxReconnectAttempts = 0; // Prevent reconnect
    this.ws?.close();
    this.ws = null;
  }
}
