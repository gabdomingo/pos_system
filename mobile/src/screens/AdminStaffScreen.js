import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Dialog, FAB, HelperText, Menu, Portal, Snackbar, Text, TextInput } from 'react-native-paper';
import { createStaffUser, getStaffUsers } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { screenShell } from '../styles/screenShell';
import { isValidStandardEmail, normalizeEmail } from '../utils/customerForm';
import { useResponsiveLayout } from '../utils/responsive';

const STAFF_ROLE_OPTIONS = [
  { value: 'cashier', label: 'Cashier', helper: 'Cashiers can sell and manage counter operations.' },
  { value: 'admin', label: 'Admin', helper: 'Admins can manage products, staff, and sales oversight.' },
];

const EMPTY_FORM = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'cashier',
};

function StaffAccountCard({ item }) {
  const roleMeta = item.role === 'admin' ? 'Full control' : 'Counter access';

  return (
    <Card style={[screenShell.sectionCard, styles.staffCard]}>
      <Card.Content>
        <View style={styles.staffHeader}>
          <View style={styles.staffIdentity}>
            <Text variant="titleMedium" style={styles.staffName}>{item.name}</Text>
            <Text style={styles.staffEmail}>{item.email}</Text>
          </View>
          <View style={[styles.roleBadge, item.role === 'admin' ? styles.roleBadgeAdmin : styles.roleBadgeCashier]}>
            <Text style={[styles.roleBadgeText, item.role === 'admin' ? styles.roleBadgeTextAdmin : styles.roleBadgeTextCashier]}>
              {item.role === 'admin' ? 'Admin' : 'Cashier'}
            </Text>
          </View>
        </View>
        <Text style={styles.staffMeta}>{roleMeta}</Text>
      </Card.Content>
    </Card>
  );
}

export default function AdminStaffScreen() {
  const { token } = useAuth();
  const layout = useResponsiveLayout();
  const [staffUsers, setStaffUsers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [roleMenuVisible, setRoleMenuVisible] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState('');
  const [error, setError] = useState('');

  const selectedRole = useMemo(
    () => STAFF_ROLE_OPTIONS.find((option) => option.value === form.role) || STAFF_ROLE_OPTIONS[0],
    [form.role]
  );

  useEffect(() => {
    loadStaffUsers();
  }, []);

  async function loadStaffUsers() {
    setRefreshing(true);
    setError('');
    try {
      const result = await getStaffUsers(token);
      setStaffUsers(Array.isArray(result?.users) ? result.users : []);
    } catch (e) {
      setError(e.message || 'Failed to load staff accounts.');
    } finally {
      setRefreshing(false);
    }
  }

  function openDialog() {
    setForm(EMPTY_FORM);
    setRoleMenuVisible(false);
    setDialogVisible(true);
  }

  function closeDialog() {
    setDialogVisible(false);
    setRoleMenuVisible(false);
    setForm(EMPTY_FORM);
  }

  async function handleCreateStaff() {
    if (!form.name.trim()) {
      setSnack('Staff name is required.');
      return;
    }
    if (!isValidStandardEmail(form.email)) {
      setSnack('Enter a valid email address.');
      return;
    }
    if (!form.password || form.password.length < 8) {
      setSnack('Password must be at least 8 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setSnack('Passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      const result = await createStaffUser(token, {
        name: form.name.trim(),
        email: normalizeEmail(form.email),
        password: form.password,
        role: form.role,
      });

      setSnack(result?.message || 'Staff account created successfully.');
      closeDialog();
      await loadStaffUsers();
    } catch (e) {
      setSnack(e.message || 'Unable to create staff account.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={screenShell.container}>
      <ScrollView
        contentContainerStyle={[
          screenShell.content,
          { paddingHorizontal: layout.screenPadding, alignSelf: 'center', width: '100%', maxWidth: layout.maxContentWidth }
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadStaffUsers} />}
      >
        <Card style={screenShell.heroCard}>
          <Card.Content>
            <Text style={screenShell.heroEyebrow}>Staff Access</Text>
            <Text variant="headlineSmall" style={screenShell.heroTitle}>Create cashier and admin accounts from the admin workspace</Text>
            <Text style={screenShell.heroCopy}>
              Staff sign-in stays locked down: admins issue the account, then each staff member uses the assigned password plus the role security code at login.
            </Text>
          </Card.Content>
        </Card>

        <Card style={[screenShell.sectionCardSoft, styles.infoCard]}>
          <Card.Content>
            <Text style={styles.infoTitle}>How this works</Text>
            <Text style={styles.infoCopy}>1. Create the staff account here.</Text>
            <Text style={styles.infoCopy}>2. Share the email and password privately.</Text>
            <Text style={styles.infoCopy}>3. Share the current role security code out of band.</Text>
          </Card.Content>
        </Card>

        {error ? <Text style={screenShell.errorText}>{error}</Text> : null}

        <View style={styles.listWrap}>
          {staffUsers.map((item) => (
            <StaffAccountCard key={item.id} item={item} />
          ))}
          {!refreshing && staffUsers.length === 0 ? (
            <Text style={screenShell.emptyText}>No staff accounts found yet.</Text>
          ) : null}
        </View>
      </ScrollView>

      <FAB icon="account-plus-outline" style={styles.fab} onPress={openDialog} label="Add Staff" />

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={closeDialog} style={layout.isExpanded ? styles.dialogWide : undefined}>
          <Dialog.Title>Create Staff Account</Dialog.Title>
          <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: 'height' })} keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}>
            <Dialog.ScrollArea style={[styles.dialogScrollArea, { maxHeight: Math.min(layout.height * 0.72, 540) }]}>
              <ScrollView contentContainerStyle={styles.dialogScrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <TextInput
                  mode="outlined"
                  label="Full Name"
                  value={form.name}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
                  style={styles.input}
                />
                <TextInput
                  mode="outlined"
                  label="Email"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={form.email}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, email: value }))}
                  style={styles.input}
                />

                <Menu
                  visible={roleMenuVisible}
                  onDismiss={() => setRoleMenuVisible(false)}
                  contentStyle={styles.roleMenu}
                  anchor={(
                    <Pressable onPress={() => setRoleMenuVisible(true)}>
                      <View pointerEvents="none">
                        <TextInput
                          mode="outlined"
                          label="Role"
                          value={selectedRole.label}
                          editable={false}
                          style={styles.input}
                          right={<TextInput.Icon icon="chevron-down" />}
                        />
                      </View>
                    </Pressable>
                  )}
                >
                  {STAFF_ROLE_OPTIONS.map((option) => (
                    <Menu.Item
                      key={option.value}
                      title={option.label}
                      onPress={() => {
                        setForm((prev) => ({ ...prev, role: option.value }));
                        setRoleMenuVisible(false);
                      }}
                    />
                  ))}
                </Menu>

                <HelperText type="info" visible style={styles.roleHelper}>
                  {selectedRole.helper}
                </HelperText>

                <TextInput
                  mode="outlined"
                  label="Temporary Password"
                  secureTextEntry
                  value={form.password}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, password: value }))}
                  style={styles.input}
                />
                <TextInput
                  mode="outlined"
                  label="Confirm Password"
                  secureTextEntry
                  value={form.confirmPassword}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, confirmPassword: value }))}
                  style={styles.input}
                />

                <HelperText type="info" visible style={styles.provisioningNote}>
                  The created staff member will still need the role security code during login.
                </HelperText>
              </ScrollView>
            </Dialog.ScrollArea>
          </KeyboardAvoidingView>
          <Dialog.Actions>
            <Button onPress={closeDialog}>Cancel</Button>
            <Button onPress={handleCreateStaff} loading={saving} disabled={saving}>
              Create
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={Boolean(snack)} onDismiss={() => setSnack('')} duration={2400}>
        {snack}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  infoCard: {
    borderRadius: 22
  },
  infoTitle: {
    color: '#163567',
    fontWeight: '700',
    marginBottom: 8
  },
  infoCopy: {
    color: '#475467',
    lineHeight: 20,
    marginBottom: 4
  },
  listWrap: {
    gap: 10
  },
  staffCard: {
    borderRadius: 22
  },
  staffHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12
  },
  staffIdentity: {
    flex: 1,
    gap: 4
  },
  staffName: {
    color: '#101828',
    fontWeight: '700'
  },
  staffEmail: {
    color: '#475467'
  },
  staffMeta: {
    color: '#667085',
    marginTop: 10
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999
  },
  roleBadgeAdmin: {
    backgroundColor: '#EAF3FF'
  },
  roleBadgeCashier: {
    backgroundColor: '#ECFDF3'
  },
  roleBadgeText: {
    fontWeight: '700',
    fontSize: 12
  },
  roleBadgeTextAdmin: {
    color: '#0B5ED7'
  },
  roleBadgeTextCashier: {
    color: '#067647'
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16
  },
  dialogScrollArea: {
    borderTopWidth: 0,
    borderBottomWidth: 0
  },
  dialogScrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 8
  },
  dialogWide: {
    alignSelf: 'center',
    width: 680
  },
  input: {
    marginBottom: 8,
    backgroundColor: '#FFFFFF'
  },
  roleMenu: {
    borderRadius: 18
  },
  roleHelper: {
    marginTop: -4,
    marginBottom: 8,
    color: '#667085'
  },
  provisioningNote: {
    marginTop: 2,
    color: '#475467'
  }
});
