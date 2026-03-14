import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, Text } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../constants/config';
import { screenShell } from '../styles/screenShell';
import { useResponsiveLayout } from '../utils/responsive';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const layout = useResponsiveLayout();
  const roleLabel = user?.role ? `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)} Account` : 'Charlie PC Account';

  return (
    <ScrollView
      style={screenShell.container}
      contentContainerStyle={[
        screenShell.content,
        { paddingHorizontal: layout.screenPadding, alignSelf: 'center', width: '100%', maxWidth: layout.maxContentWidth }
      ]}
    >
      <Card style={screenShell.heroCard}>
        <Card.Content>
          <Text style={screenShell.heroEyebrow}>{roleLabel}</Text>
          <Text variant="headlineSmall" style={screenShell.heroTitle}>Charlie PC Account Profile</Text>
          <Text style={screenShell.heroCopy}>Review the active Charlie PC account, confirm the signed-in role, and log out securely from the same mobile shell used across the app.</Text>
        </Card.Content>
      </Card>

      <Card style={[screenShell.sectionCard, styles.card, { alignSelf: 'center', width: '100%', maxWidth: layout.isExpanded ? 760 : 640 }]}>
        <Card.Title title="Profile" subtitle="Current signed in account" />
        <Card.Content>
          <View style={styles.infoBlock}>
            <Text style={styles.label}>Full Name</Text>
            <Text variant="titleMedium">{user?.name || 'Unknown User'}</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.meta}>{user?.email || '-'}</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.label}>Role</Text>
            <Text style={styles.meta}>{user?.role || 'unknown'}</Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.infoBlock}>
            <Text style={styles.label}>API Base URL</Text>
            <Text selectable style={styles.meta}>{API_BASE_URL}</Text>
          </View>
          <Button mode="contained" style={styles.logoutBtn} onPress={signOut}>
            Logout
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 0
  },
  infoBlock: {
    marginBottom: 12
  },
  label: {
    marginBottom: 4,
    color: '#18335F',
    fontWeight: '700'
  },
  meta: {
    color: '#475467'
  },
  divider: {
    marginVertical: 16
  },
  logoutBtn: {
    marginTop: 16
  }
});
