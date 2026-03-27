import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { Button, Card, HelperText, Text, TextInput } from 'react-native-paper';
import { authRoleOptions } from '../constants/authRoles';
import { useAuth } from '../context/AuthContext';
import { authStyles } from '../styles/authStyles';
import { isValidStandardEmail, normalizeEmail } from '../utils/customerForm';
import { useResponsiveLayout } from '../utils/responsive';

export default function LoginScreen({ navigation }) {
  const { signIn, startPasswordReset, completePasswordReset } = useAuth();
  const layout = useResponsiveLayout();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [securityCode, setSecurityCode] = useState('');
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotPassword, setForgotPassword] = useState('');
  const [forgotConfirm, setForgotConfirm] = useState('');
  const [forgotInfo, setForgotInfo] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotCodeRequested, setForgotCodeRequested] = useState(false);
  const selectedRole = authRoleOptions.find((option) => option.value === role) || authRoleOptions[0];
  const requiresSecurityCode = role === 'admin' || role === 'cashier';

  useEffect(() => {
    if (role === 'customer') {
      setSecurityCode('');
    }
  }, [role]);

  async function submit() {
    setError('');
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    if (!isValidStandardEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (requiresSecurityCode && !securityCode.trim()) {
      setError('Security code is required for admin and cashier login.');
      return;
    }
    setLoading(true);
    try {
      await signIn({ email: normalizeEmail(email), password, role, securityCode: securityCode.trim() });
    } catch (e) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestReset() {
    setForgotError('');
    setForgotInfo('');

    if (!isValidStandardEmail(forgotEmail)) {
      setForgotError('Enter a valid email to request a reset code.');
      return;
    }

    setForgotLoading(true);
    try {
      const result = await startPasswordReset(normalizeEmail(forgotEmail));
      const ttlText = result?.ttlMinutes ? ` It expires in ${result.ttlMinutes} minutes.` : '';
      const demoCodeText = result?.demoCode ? ` Demo code: ${result.demoCode}` : '';
      setForgotInfo(`${result?.message || 'Reset code prepared.'}${ttlText}${demoCodeText}`);
      setForgotCodeRequested(true);
    } catch (e) {
      setForgotError(e.message || 'Unable to request reset code.');
    } finally {
      setForgotLoading(false);
    }
  }

  async function handleResetPassword() {
    setForgotError('');
    setForgotInfo('');

    if (!isValidStandardEmail(forgotEmail)) {
      setForgotError('Enter a valid email address.');
      return;
    }
    if (!/^\d{6}$/.test(forgotCode.trim())) {
      setForgotError('Reset code must be 6 digits.');
      return;
    }
    if (!forgotPassword || forgotPassword.length < 8) {
      setForgotError('New password must be at least 8 characters.');
      return;
    }
    if (forgotPassword !== forgotConfirm) {
      setForgotError('Passwords do not match.');
      return;
    }

    setForgotLoading(true);
    try {
      const result = await completePasswordReset({
        email: normalizeEmail(forgotEmail),
        code: forgotCode.trim(),
        newPassword: forgotPassword,
        confirmPassword: forgotConfirm,
      });
      setForgotInfo(result?.message || 'Password reset successful. You can now sign in.');
      setForgotCodeRequested(false);
      setPassword('');
      setForgotCode('');
      setForgotPassword('');
      setForgotConfirm('');
    } catch (e) {
      setForgotError(e.message || 'Unable to reset password.');
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: 'height' })}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 48}
      style={authStyles.container}
    >
      <ScrollView
        contentContainerStyle={[
          authStyles.scrollContent,
          { paddingHorizontal: layout.screenPadding, justifyContent: layout.isCompact ? 'flex-start' : 'center' }
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={authStyles.hero}>
          <Text style={authStyles.kicker}>Charlie PC Store Portal</Text>
          <Text variant="headlineMedium" style={authStyles.heroTitle}>
            Sign in to the right PC shop workspace.
          </Text>
          <Text style={authStyles.heroCopy}>
            Use one consistent Charlie PC entry point for customer shopping, cashier checkout, and admin operations.
          </Text>

          <View style={authStyles.tagRow}>
            <View style={authStyles.tag}>
              <Text style={authStyles.tagText}>Storefront</Text>
            </View>
            <View style={authStyles.tag}>
              <Text style={authStyles.tagText}>Counter Sales</Text>
            </View>
            <View style={authStyles.tag}>
              <Text style={authStyles.tagText}>Admin Control</Text>
            </View>
          </View>

          <View style={authStyles.showcaseGrid}>
            <View style={[authStyles.showcaseCard, layout.isTwoPane && authStyles.showcaseCardWide]}>
              <Text style={authStyles.showcaseLabel}>Access Ready</Text>
              <Text style={authStyles.showcaseCopy}>Choose the right role first so the correct workspace opens after login.</Text>
            </View>
            <View style={[authStyles.showcaseCard, layout.isTwoPane && authStyles.showcaseCardWide]}>
              <Text style={authStyles.showcaseLabel}>Shop Workflow</Text>
              <Text style={authStyles.showcaseCopy}>The same visual system now carries from web auth to the mobile app.</Text>
            </View>
          </View>
        </View>

        <Card style={[authStyles.card, layout.isExpanded && authStyles.cardWide]}>
          <Card.Content>
            <Text style={authStyles.cardTopline}>Store Access</Text>
            <Text variant="titleLarge" style={authStyles.cardTitle}>Welcome to Charlie PC</Text>
            <Text style={authStyles.cardSubtitle}>Choose who is using the system first, then continue with the account details.</Text>

            <View style={authStyles.roleBanner}>
              <Text style={authStyles.roleBannerLabel}>Signing in as</Text>
              <Text variant="titleMedium" style={authStyles.roleBannerTitle}>{selectedRole.label}</Text>
              <Text style={authStyles.roleBannerCopy}>{selectedRole.copy}</Text>
            </View>

            <View style={authStyles.roleGrid}>
              {authRoleOptions.map((option) => {
                const active = option.value === role;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setRole(option.value)}
                    style={[authStyles.roleCard, layout.isTwoPane && authStyles.roleCardWide, active && authStyles.roleCardActive]}
                  >
                    <Text style={[authStyles.roleTitle, active && authStyles.roleTitleActive]}>{option.label}</Text>
                    <Text style={authStyles.roleCopy}>{option.copy}</Text>
                    <Text style={authStyles.roleMeta}>{option.meta}</Text>
                  </Pressable>
                );
              })}
            </View>

            {!showForgotPassword && (
              <>
                <TextInput
                  mode="outlined"
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={authStyles.input}
                />
                <TextInput
                  mode="outlined"
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={secure}
                  right={<TextInput.Icon icon={secure ? 'eye-off' : 'eye'} onPress={() => setSecure((s) => !s)} />}
                  style={authStyles.input}
                />

                {requiresSecurityCode && (
                  <>
                    <TextInput
                      mode="outlined"
                      label="Security Code"
                      value={securityCode}
                      onChangeText={setSecurityCode}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      style={authStyles.input}
                    />
                    <Text style={authStyles.inlineNote}>
                      Staff sign-in uses both the account password and the role security code.
                    </Text>
                  </>
                )}

                <Text style={authStyles.roleHint}>Selected access: {selectedRole.label}</Text>
                <Text style={authStyles.roleHintMuted}>Use the account that matches the selected role so the correct workspace opens after sign-in.</Text>

                <HelperText type="error" visible={Boolean(error)}>{error}</HelperText>

                <Button mode="contained" onPress={submit} loading={loading} disabled={loading} style={authStyles.button} contentStyle={authStyles.buttonContent}>
                  Log In
                </Button>
              </>
            )}

            <View style={authStyles.footer}>
              {role === 'customer' ? (
                <>
                  <Text variant="bodyMedium">Need customer access?</Text>
                  <Button compact onPress={() => navigation.navigate('Register')}>Create account</Button>
                </>
              ) : (
                <Text style={authStyles.staffProvisionText}>Staff accounts are created by an admin and cannot be self-registered on mobile.</Text>
              )}
              <Button
                compact
                onPress={() => {
                  setShowForgotPassword((current) => {
                    const next = !current;
                    if (!next) {
                      setForgotCodeRequested(false);
                    }
                    return next;
                  });
                  setForgotEmail((current) => current || email);
                  setForgotError('');
                  setForgotInfo('');
                }}
              >
                {showForgotPassword ? 'Close reset' : 'Forgot password?'}
              </Button>
            </View>

            {showForgotPassword && (
              <View style={authStyles.forgotPanel}>
                <Text style={authStyles.forgotTitle}>Reset your password</Text>
                <Text style={authStyles.forgotCopy}>
                  Request a 6-digit reset code first, then set a new password.
                </Text>

                <TextInput
                  mode="outlined"
                  label="Account Email"
                  value={forgotEmail}
                  onChangeText={setForgotEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={authStyles.input}
                />

                <View style={authStyles.inlineActions}>
                  <Button mode="outlined" onPress={handleRequestReset} loading={forgotLoading} disabled={forgotLoading}>
                    {forgotLoading ? 'Sending...' : forgotCodeRequested ? 'Resend code' : 'Send reset code'}
                  </Button>
                </View>

                {forgotInfo ? <Text style={authStyles.successText}>{forgotInfo}</Text> : null}
                {forgotError ? <Text style={authStyles.errorText}>{forgotError}</Text> : null}

                {forgotCodeRequested && (
                  <>
                    <TextInput
                      mode="outlined"
                      label="Reset Code"
                      value={forgotCode}
                      onChangeText={setForgotCode}
                      keyboardType="number-pad"
                      style={authStyles.input}
                    />

                    <TextInput
                      mode="outlined"
                      label="New Password"
                      value={forgotPassword}
                      onChangeText={setForgotPassword}
                      secureTextEntry
                      style={authStyles.input}
                    />

                    <TextInput
                      mode="outlined"
                      label="Confirm New Password"
                      value={forgotConfirm}
                      onChangeText={setForgotConfirm}
                      secureTextEntry
                      style={authStyles.input}
                    />

                    <View style={authStyles.inlineActions}>
                      <Button mode="contained" onPress={handleResetPassword} loading={forgotLoading} disabled={forgotLoading}>
                        {forgotLoading ? 'Resetting...' : 'Reset Password'}
                      </Button>
                    </View>
                  </>
                )}
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
