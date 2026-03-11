import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Button, Card, HelperText, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="POS Mobile" subtitle="Sign in to continue" />
        <Card.Content>
          <TextInput
            mode="outlined"
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
          <TextInput
            mode="outlined"
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secure}
            right={<TextInput.Icon icon={secure ? 'eye-off' : 'eye'} onPress={() => setSecure((s) => !s)} />}
            style={styles.input}
          />

          <Text style={styles.label}>Role</Text>
          <SegmentedButtons
            value={role}
            onValueChange={setRole}
            buttons={[
              { value: 'customer', label: 'Customer' },
              { value: 'cashier', label: 'Cashier' },
              { value: 'admin', label: 'Admin' }
            ]}
            style={styles.segment}
          />

          <HelperText type="error" visible={Boolean(error)}>{error}</HelperText>

          <Button mode="contained" onPress={submit} loading={loading} disabled={loading} style={styles.button}>
            Log In
          </Button>

          <View style={styles.footer}>
            <Text variant="bodyMedium">No account yet?</Text>
            <Button compact onPress={() => navigation.navigate('Register')}>Create one</Button>
          </View>
        </Card.Content>
      </Card>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#F4F6FA'
  },
  card: {
    borderRadius: 16
  },
  input: {
    marginBottom: 12
  },
  label: {
    marginTop: 4,
    marginBottom: 8,
    color: '#344054'
  },
  segment: {
    marginBottom: 8
  },
  button: {
    marginTop: 8
  },
  footer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  }
});
