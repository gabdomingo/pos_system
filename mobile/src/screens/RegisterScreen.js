import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Button, Card, HelperText, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      await signUp({ name: name.trim(), email: email.trim(), password, role });
    } catch (e) {
      setError(e.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Create Account" subtitle="Set up your POS Mobile account" />
        <Card.Content>
          <TextInput mode="outlined" label="Full Name" value={name} onChangeText={setName} style={styles.input} />
          <TextInput
            mode="outlined"
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
          <TextInput mode="outlined" label="Password" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
          <TextInput mode="outlined" label="Confirm Password" value={confirm} onChangeText={setConfirm} secureTextEntry style={styles.input} />

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
            Create Account
          </Button>

          <View style={styles.footer}>
            <Text variant="bodyMedium">Already registered?</Text>
            <Button compact onPress={() => navigation.goBack()}>Back to login</Button>
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
