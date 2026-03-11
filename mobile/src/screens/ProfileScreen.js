import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Divider, Text } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../constants/config';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Profile" subtitle="Current signed in account" />
        <Card.Content>
          <Text variant="titleMedium">{user?.name || 'Unknown User'}</Text>
          <Text style={styles.meta}>{user?.email}</Text>
          <Text style={styles.meta}>Role: {user?.role || 'unknown'}</Text>
          <Divider style={styles.divider} />
          <Text style={styles.meta}>API Base URL</Text>
          <Text selectable>{API_BASE_URL}</Text>
          <Button mode="contained" style={styles.logoutBtn} onPress={signOut}>
            Logout
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6FA',
    padding: 16
  },
  card: {
    borderRadius: 16
  },
  meta: {
    marginTop: 4,
    color: '#475467'
  },
  divider: {
    marginVertical: 16
  },
  logoutBtn: {
    marginTop: 16
  }
});
