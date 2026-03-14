import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { Button, Card, HelperText, Text, TextInput } from 'react-native-paper';
import { authRoleOptions } from '../constants/authRoles';
import { useAuth } from '../context/AuthContext';
import { authStyles } from '../styles/authStyles';
import { useResponsiveLayout } from '../utils/responsive';

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();
  const layout = useResponsiveLayout();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const selectedRole = authRoleOptions.find((option) => option.value === role) || authRoleOptions[0];

  async function submit() {
    setError('');
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);
    try {
      await signIn({ email: email.trim(), password, role });
    } catch (e) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
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

            <Text style={authStyles.roleHint}>Selected access: {selectedRole.label}</Text>
            <Text style={authStyles.roleHintMuted}>Use the account that matches the selected role so the correct workspace opens after sign-in.</Text>

            <HelperText type="error" visible={Boolean(error)}>{error}</HelperText>

            <Button mode="contained" onPress={submit} loading={loading} disabled={loading} style={authStyles.button} contentStyle={authStyles.buttonContent}>
              Log In
            </Button>

            <View style={authStyles.footer}>
              <Text variant="bodyMedium">No account yet?</Text>
              <Button compact onPress={() => navigation.navigate('Register')}>Create one</Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
