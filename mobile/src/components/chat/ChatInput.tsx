import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [text, setText] = useState('');

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Type a message..."
        placeholderTextColor={colors.placeholder}
        multiline
        maxLength={2000}
        editable={!disabled}
        onSubmitEditing={handleSend}
        blurOnSubmit={false}
      />
      <TouchableOpacity
        style={[styles.sendButton, (!text.trim() || disabled) && styles.sendDisabled]}
        onPress={handleSend}
        disabled={!text.trim() || disabled}
      >
        <SendIcon />
      </TouchableOpacity>
    </View>
  );
}

function SendIcon() {
  return (
    <View style={styles.sendIcon}>
      <View style={styles.arrow} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    color: colors.text,
  },
  sendButton: {
    marginLeft: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendDisabled: {
    backgroundColor: colors.border,
  },
  sendIcon: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.textInverse,
    transform: [{ rotate: '90deg' }],
  },
});
