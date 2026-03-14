import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { Button, Card, HelperText, Text, TextInput } from 'react-native-paper';
import { authRoleOptions } from '../constants/authRoles';
import { useAuth } from '../context/AuthContext';
import { authStyles } from '../styles/authStyles';
import { isValidStandardEmail, normalizeEmail } from '../utils/customerForm';
import { useResponsiveLayout } from '../utils/responsive';

export default function RegisterScreen({ navigation }) {
  const { signUp } = useAuth();
  const layout = useResponsiveLayout();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState('customer');
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const selectedRole = authRoleOptions.find((option) => option.value === role) || authRoleOptions[0];

  async function submit() {
    setError('');
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    if (!isValidStandardEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await signUp({ name: name.trim(), email: normalizeEmail(email), password, role });
    } catch (e) {
      setError(e.message || 'Registration failed');
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
          <Text style={authStyles.kicker}>Charlie PC Account Setup</Text>
          <Text variant="headlineMedium" style={authStyles.heroTitle}>
            Create access once and use the same Charlie PC flow everywhere.
          </Text>
          <Text style={authStyles.heroCopy}>
            Register for shopping, cashier operations, or admin work using the same portal style and role-based access pattern.
          </Text>

          <View style={authStyles.tagRow}>
            <View style={authStyles.tag}>
              <Text style={authStyles.tagText}>Web and Mobile</Text>
            </View>
            <View style={authStyles.tag}>
              <Text style={authStyles.tagText}>Role-Based</Text>
            </View>
            <View style={authStyles.tag}>
              <Text style={authStyles.tagText}>Charlie PC Ready</Text>
            </View>
          </View>

          <View style={authStyles.showcaseGrid}>
            <View style={[authStyles.showcaseCard, layout.isTwoPane && authStyles.showcaseCardWide]}>
              <Text style={authStyles.showcaseLabel}>Setup Flow</Text>
              <Text style={authStyles.showcaseCopy}>Pick the workspace first, then fill in the account details that match that role.</Text>
            </View>
            <View style={[authStyles.showcaseCard, layout.isTwoPane && authStyles.showcaseCardWide]}>
              <Text style={authStyles.showcaseLabel}>Consistent Design</Text>
              <Text style={authStyles.showcaseCopy}>Register now matches login so the auth experience feels like one product.</Text>
            </View>
          </View>
        </View>

        <Card style={[authStyles.card, layout.isExpanded && authStyles.cardWide]}>
          <Card.Content>
            <Text style={authStyles.cardTopline}>Create Access</Text>
            <Text variant="titleLarge" style={authStyles.cardTitle}>Create your Charlie PC account</Text>
            <Text style={authStyles.cardSubtitle}>Choose the role first, then complete the account information below.</Text>

            <View style={authStyles.roleBanner}>
              <Text style={authStyles.roleBannerLabel}>Creating access for</Text>
              <Text variant="titleMedium" style={authStyles.roleBannerTitle}>{selectedRole.label}</Text>
              <Text style={authStyles.roleBannerCopy}>{selectedRole.setup}</Text>
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

            <View style={authStyles.fieldGrid}>
              <View style={[authStyles.fieldBlock, layout.isExpanded && authStyles.fieldBlockHalf]}>
                <TextInput
                  mode="outlined"
                  label="Full Name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  style={authStyles.input}
                />
              </View>
              <View style={[authStyles.fieldBlock, layout.isExpanded && authStyles.fieldBlockHalf]}>
                <TextInput
                  mode="outlined"
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={authStyles.input}
                />
              </View>
            </View>

            <View style={authStyles.helperChips}>
              <View style={authStyles.helperChip}>
                <Text style={authStyles.helperChipText}>Minimum 6-character password</Text>
              </View>
              <View style={authStyles.helperChip}>
                <Text style={authStyles.helperChipText}>{selectedRole.meta}</Text>
              </View>
              <View style={authStyles.helperChip}>
                <Text style={authStyles.helperChipText}>Same style on web and mobile</Text>
              </View>
            </View>

            <View style={authStyles.fieldGrid}>
              <View style={[authStyles.fieldBlock, layout.isExpanded && authStyles.fieldBlockHalf]}>
                <TextInput
                  mode="outlined"
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={secure}
                  right={<TextInput.Icon icon={secure ? 'eye-off' : 'eye'} onPress={() => setSecure((state) => !state)} />}
                  style={authStyles.input}
                />
              </View>
              <View style={[authStyles.fieldBlock, layout.isExpanded && authStyles.fieldBlockHalf]}>
                <TextInput
                  mode="outlined"
                  label="Confirm Password"
                  value={confirm}
                  onChangeText={setConfirm}
                  secureTextEntry={secure}
                  style={authStyles.input}
                />
              </View>
            </View>

            <Text style={authStyles.roleHint}>Selected access: {selectedRole.label}</Text>
            <Text style={authStyles.roleHintMuted}>
              This account will open the {selectedRole.label.toLowerCase()} workspace after sign-in with the same Charlie PC auth layout.
            </Text>

            <HelperText type="error" visible={Boolean(error)}>{error}</HelperText>

            <Button mode="contained" onPress={submit} loading={loading} disabled={loading} style={authStyles.button} contentStyle={authStyles.buttonContent}>
              Create Account
            </Button>

            <View style={authStyles.footer}>
              <Text variant="bodyMedium">Already registered?</Text>
              <Button compact onPress={() => navigation.goBack()}>Back to login</Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
