import React, { useEffect, useRef, useCallback } from 'react';
import { View, FlatList, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { colors } from '../../theme/colors';
import { useChatStore } from '../../store/chatStore';
import { useDataStore } from '../../store/dataStore';
import { ChatWebSocket } from '../../services/chat';
import { createConversation } from '../../services/family';
import MessageBubble from '../../components/chat/MessageBubble';
import ChatInput from '../../components/chat/ChatInput';
import TypingIndicator from '../../components/chat/TypingIndicator';
import QuizOptions from '../../components/chat/QuizOptions';
import SavedContentCard from '../../components/chat/SavedContentCard';
import type { ChatMessage, SavedContentInfo } from '../../types/chat';
import type { WSEvent } from '../../types/chat';

export default function ChatScreen({ navigation, route }: any) {
  const wsRef = useRef<ChatWebSocket | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const conversationIdRef = useRef<string | null>(null);
  const pendingPromptRef = useRef<string | null>(null);
  const lastPromptKeyRef = useRef<number>(0);

  const {
    messages,
    isStreaming,
    currentStreamText,
    activeQuiz,
    addUserMessage,
    addSavedContentCard,
    startStream,
    appendStreamChunk,
    endStream,
    setQuizOptions,
    clearQuiz,
  } = useChatStore();

  const handleWSEvent = useCallback((event: WSEvent) => {
    switch (event.type) {
      case 'connected':
        // A quick-action prompt may have arrived before the socket opened
        if (pendingPromptRef.current) {
          const prompt = pendingPromptRef.current;
          pendingPromptRef.current = null;
          addUserMessage(prompt);
          wsRef.current?.sendMessage(prompt);
        }
        break;
      case 'stream_start':
        startStream();
        break;
      case 'stream_chunk':
        if (event.content) appendStreamChunk(event.content);
        break;
      case 'stream_end':
        endStream();
        break;
      case 'quiz_options':
        if (event.question && event.options) {
          setQuizOptions({
            question: event.question,
            options: event.options,
            allowMultiple: event.allow_multiple || false,
          });
        }
        break;
      case 'content_saved': {
        const contentType = event.content_type as SavedContentInfo['contentType'];
        addSavedContentCard({
          contentType,
          title: event.data?.title,
          recipeId: event.data?.recipe_id,
        });
        // Refetch the affected module so tabs are fresh when the user switches
        const data = useDataStore.getState();
        if (contentType === 'recipe_saved') data.loadRecipes();
        else if (contentType === 'meal_plan_saved') data.loadMealPlan();
        else if (contentType === 'grocery_list_saved') data.loadGroceryList();
        else if (contentType === 'nutrition_logged') data.loadNutrition();
        data.loadDashboard();
        break;
      }
      case 'error':
        endStream();
        break;
    }
  }, [startStream, appendStreamChunk, endStream, setQuizOptions, addSavedContentCard]);

  const handleCardPress = useCallback(
    (info: SavedContentInfo) => {
      switch (info.contentType) {
        case 'recipe_saved':
          if (info.recipeId) {
            navigation.navigate('Recipes', {
              screen: 'RecipeDetail',
              params: { recipeId: info.recipeId },
              initial: false,
            });
          } else {
            navigation.navigate('Recipes');
          }
          break;
        case 'meal_plan_saved':
          navigation.navigate('Meals');
          break;
        case 'grocery_list_saved':
          navigation.navigate('Grocery');
          break;
        case 'nutrition_logged':
          navigation.navigate('Home', { screen: 'Nutrition', initial: false });
          break;
      }
    },
    [navigation]
  );

  useEffect(() => {
    const init = async () => {
      try {
        const conv = await createConversation('New Chat');
        conversationIdRef.current = conv.id;
        const ws = new ChatWebSocket(conv.id, handleWSEvent);
        wsRef.current = ws;
        ws.connect();
      } catch (e: any) {
        console.error('Failed to create conversation:', e);
        startStream();
        appendStreamChunk(
          `I couldn't start a conversation with the server (${e?.message || 'unknown error'}). ` +
            'Pull down or reopen this tab to retry.'
        );
        endStream();
      }
    };

    init();

    return () => {
      wsRef.current?.disconnect();
    };
  }, [handleWSEvent]);

  // Quick actions on other tabs deep-link here with a prompt to auto-send
  useEffect(() => {
    const prompt: string | undefined = route?.params?.initialPrompt;
    const promptKey: number | undefined = route?.params?.promptKey;
    if (!prompt || !promptKey || promptKey === lastPromptKeyRef.current) return;
    lastPromptKeyRef.current = promptKey;

    if (wsRef.current?.isConnected()) {
      addUserMessage(prompt);
      clearQuiz();
      wsRef.current.sendMessage(prompt);
    } else {
      pendingPromptRef.current = prompt;
    }
  }, [route?.params?.promptKey]);

  const handleSend = (text: string) => {
    if (!wsRef.current?.isConnected()) {
      addUserMessage(text);
      appendSystemNotice();
      return;
    }
    addUserMessage(text);
    clearQuiz();
    wsRef.current.sendMessage(text);
  };

  // Surface connection problems instead of silently dropping messages
  const appendSystemNotice = () => {
    startStream();
    appendStreamChunk(
      "I couldn't reach the server just now. Check that your phone is on the same WiFi as the backend, then try again."
    );
    endStream();
  };

  const handleQuizSelect = (optionId: string, label: string) => {
    addUserMessage(label);
    clearQuiz();
    wsRef.current?.sendQuizResponse(optionId, label);
  };

  const renderItem = ({ item }: { item: ChatMessage }) =>
    item.savedContent ? (
      <SavedContentCard info={item.savedContent} onPress={() => handleCardPress(item.savedContent!)} />
    ) : (
      <MessageBubble message={item} />
    );

  // Build display list: messages + streaming text
  const displayMessages = [...messages];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={displayMessages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={
          <>
            {isStreaming && currentStreamText ? (
              <MessageBubble
                message={{
                  id: 'streaming',
                  role: 'assistant',
                  content: currentStreamText + ' ▍',
                  timestamp: new Date(),
                }}
              />
            ) : null}
            {isStreaming && !currentStreamText ? <TypingIndicator /> : null}
            {activeQuiz ? (
              <QuizOptions quiz={activeQuiz} onSelect={handleQuizSelect} />
            ) : null}
          </>
        }
      />
      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  messageList: {
    paddingVertical: 16,
  },
});
