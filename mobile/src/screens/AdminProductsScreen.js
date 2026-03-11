import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { Button, Card, Dialog, FAB, Portal, Snackbar, Text, TextInput } from 'react-native-paper';
import { addProduct, deleteProduct, getProducts, updateProduct } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatNumber } from '../utils/format';

const EMPTY_FORM = { name: '', category: '', price: '', stock: '', barcode: '', image: '' };

export default function AdminProductsScreen() {
  const { token, user } = useAuth();
  const canEditDelete = user?.role === 'admin';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [snack, setSnack] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    try {
      const data = await getProducts('');
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      setSnack(e.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogVisible(true);
  }

  function openEdit(product) {
    if (!canEditDelete) {
      setSnack('Only admin can edit products');
      return;
    }
    setEditing(product);
    setForm({
      name: product.name || '',
      category: product.category || '',
      price: String(product.price ?? ''),
      stock: String(product.stock ?? ''),
      barcode: product.barcode || '',
      image: product.image || ''
    });
    setDialogVisible(true);
  }

  async function save() {
    if (!form.name.trim()) {
      setSnack('Product name is required');
      return;
    }

    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      price: Number(form.price || 0),
      stock: Number(form.stock || 0),
      barcode: form.barcode.trim(),
      image: form.image.trim()
    };

    try {
      if (editing) {
        if (!canEditDelete) {
          setSnack('Only admin can edit products');
          return;
        }
        await updateProduct(token, editing.id, payload);
        setSnack('Product updated');
      } else {
        await addProduct(token, payload);
        setSnack('Product created');
      }
      setDialogVisible(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      loadProducts();
    } catch (e) {
      setSnack(e.message || 'Save failed');
    }
  }

  function askDelete(product) {
    Alert.alert(
      'Delete product',
      `Delete ${product.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(token, product.id);
              setSnack('Product deleted');
              loadProducts();
            } catch (e) {
              setSnack(e.message || 'Delete failed');
            }
          }
        }
      ]
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={loadProducts}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Title title={item.name} subtitle={item.category || 'Uncategorized'} />
            <Card.Content>
              <Text>{formatCurrency(item.price || 0)}</Text>
              <Text style={styles.meta}>Stock: {formatNumber(item.stock || 0)}</Text>
            </Card.Content>
            <Card.Actions>
              {canEditDelete ? (
                <>
                  <Button onPress={() => openEdit(item)}>Edit</Button>
                  <Button textColor="#B42318" onPress={() => askDelete(item)}>Delete</Button>
                </>
              ) : (
                <Text style={styles.meta}>Cashier can add products only</Text>
              )}
            </Card.Actions>
          </Card>
        )}
      />

      <FAB icon="plus" style={styles.fab} onPress={openAdd} label="Add" />

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>{editing ? 'Edit Product' : 'Add Product'}</Dialog.Title>
          <Dialog.Content>
            <TextInput label="Name" mode="outlined" value={form.name} onChangeText={(v) => setForm((p) => ({ ...p, name: v }))} style={styles.input} />
            <TextInput label="Category" mode="outlined" value={form.category} onChangeText={(v) => setForm((p) => ({ ...p, category: v }))} style={styles.input} />
            <TextInput label="Price" mode="outlined" keyboardType="decimal-pad" value={form.price} onChangeText={(v) => setForm((p) => ({ ...p, price: v }))} style={styles.input} />
            <TextInput label="Stock" mode="outlined" keyboardType="number-pad" value={form.stock} onChangeText={(v) => setForm((p) => ({ ...p, stock: v }))} style={styles.input} />
            <TextInput label="Barcode" mode="outlined" value={form.barcode} onChangeText={(v) => setForm((p) => ({ ...p, barcode: v }))} style={styles.input} />
            <TextInput label="Image URL" mode="outlined" value={form.image} onChangeText={(v) => setForm((p) => ({ ...p, image: v }))} style={styles.input} />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button onPress={save}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={Boolean(snack)} onDismiss={() => setSnack('')} duration={2200}>
        {snack}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6FA'
  },
  listContent: {
    padding: 12,
    paddingBottom: 90,
    gap: 10
  },
  card: {
    borderRadius: 14
  },
  meta: {
    color: '#667085',
    marginTop: 2
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16
  },
  input: {
    marginBottom: 8
  }
});
