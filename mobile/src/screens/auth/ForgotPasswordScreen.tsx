import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { apiFetch } from '../../services/api';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';

export default function ForgotPasswordScreen({ navigation }: any) {
  const [step, setStep] = useState<'email' | 'reset' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendCode = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      });
      setStep('reset');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          code: code.trim(),
          new_password: newPassword,
        }),
      });
      setStep('done');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Reset Password</Text>

        {step === 'email' ? (
          <>
            <Text style={styles.instructions}>
              Enter your account email and we'll send you a 6-digit reset code.
            </Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.placeholder}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TouchableOpacity
              style={[styles.button, !email.trim() && styles.buttonDisabled]}
              onPress={sendCode}
              disabled={loading || !email.trim()}
            >
              {loading ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <Text style={styles.buttonText}>Send Code</Text>
              )}
            </TouchableOpacity>
          </>
        ) : null}

        {step === 'reset' ? (
          <>
            <Text style={styles.instructions}>
              Check {email.trim()} for the code, then choose a new password (8+ characters).
            </Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TextInput
              style={[styles.input, styles.codeInput]}
              placeholder="6-digit code"
              placeholderTextColor={colors.placeholder}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
            />
            <TextInput
              style={styles.input}
              placeholder="New password"
              placeholderTextColor={colors.placeholder}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <TouchableOpacity
              style={[
                styles.button,
                (code.trim().length < 6 || newPassword.length < 8) && styles.buttonDisabled,
              ]}
              onPress={resetPassword}
              disabled={loading || code.trim().length < 6 || newPassword.length < 8}
            >
              {loading ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <Text style={styles.buttonText}>Reset Password</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={sendCode} disabled={loading}>
              <Text style={styles.linkText}>
                Didn't get it? <Text style={styles.link}>Resend code</Text>
              </Text>
            </TouchableOpacity>
          </>
        ) : null}

        {step === 'done' ? (
          <>
            <Text style={styles.instructions}>
              Your password has been reset. Log in with your new password.
            </Text>
            <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
              <Text style={styles.buttonText}>Back to Log In</Text>
            </TouchableOpacity>
          </>
        ) : null}

        {step !== 'done' ? (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.linkText}>
              Remembered it? <Text style={styles.link}>Back to log in</Text>
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 28,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  instructions: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    color: colors.text,
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 22,
    letterSpacing: 6,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: colors.error,
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
  },
  linkText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 8,
  },
  link: {
    color: colors.primary,
    fontWeight: '600',
  },
});
