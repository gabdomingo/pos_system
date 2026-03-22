import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import { Button, Card, Dialog, FAB, HelperText, Menu, Portal, Snackbar, Text, TextInput } from 'react-native-paper';
import { addProduct, deleteProduct, getProducts, updateProduct } from '../api/client';
import { PRODUCT_CATEGORIES } from '../constants/productCategories';
import { useAuth } from '../context/AuthContext';
import { screenShell } from '../styles/screenShell';
import { formatCurrency, formatNumber } from '../utils/format';
import { useResponsiveLayout } from '../utils/responsive';

const EMPTY_FORM = {
  name: '',
  category: '',
  price: '',
  stock: '',
  barcode: '',
  image: '',
  imagePreview: '',
  resetImage: false
};

const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;

function estimateBase64Bytes(base64) {
  const clean = String(base64 || '').trim();
  if (!clean) return 0;
  const padding = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0;
  return Math.floor((clean.length * 3) / 4) - padding;
}

export default function AdminProductsScreen() {
  const { token, user } = useAuth();
  const layout = useResponsiveLayout();
  const canEditDelete = user?.role === 'admin';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
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
    setCategoryMenuVisible(false);
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
      image: '',
      imagePreview: product.image || '',
      resetImage: false
    });
    setCategoryMenuVisible(false);
    setDialogVisible(true);
  }

  async function selectProductImage(mode = 'library') {
    try {
      const permissionResult = mode === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.status !== 'granted') {
        setSnack(mode === 'camera' ? 'Camera permission is required to take a product photo.' : 'Photo library permission is required to choose an image.');
        return;
      }

      const pickerResult = mode === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.6,
            base64: true
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.6,
            base64: true
          });

      if (pickerResult.canceled) return;

      const asset = pickerResult.assets?.[0];
      if (!asset?.base64) {
        setSnack('Selected image could not be processed. Please try another photo.');
        return;
      }

      const sizeBytes = estimateBase64Bytes(asset.base64);
      if (sizeBytes > MAX_UPLOAD_BYTES) {
        setSnack('Image is too large. Please choose a smaller photo.');
        return;
      }

      const mimeType = asset.mimeType || 'image/jpeg';
      const imageDataUrl = `data:${mimeType};base64,${asset.base64}`;

      setForm((prev) => ({
        ...prev,
        image: imageDataUrl,
        imagePreview: imageDataUrl,
        resetImage: false
      }));
    } catch (e) {
      setSnack(e.message || 'Unable to pick image');
    }
  }

  function resetProductImage() {
    setForm((prev) => ({
      ...prev,
      image: '',
      imagePreview: '',
      resetImage: Boolean(editing),
    }));
  }

  async function save() {
    if (!form.name.trim()) {
      setSnack('Product name is required');
      return;
    }
    if (!form.category.trim()) {
      setSnack('Please select a category');
      return;
    }

    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      price: Number(form.price || 0),
      stock: Number(form.stock || 0),
      barcode: form.barcode.trim()
    };

    if (form.image) payload.image = form.image;
    if (editing && form.resetImage) payload.resetImage = true;

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
    <View style={screenShell.container}>
      <FlatList
        key={layout.adminColumns}
        data={products}
        keyExtractor={(item) => String(item.id)}
        numColumns={layout.adminColumns}
        columnWrapperStyle={layout.adminColumns > 1 ? styles.columnWrap : undefined}
        contentContainerStyle={[
          screenShell.listContent,
          { paddingHorizontal: layout.screenPadding, alignSelf: 'center', width: '100%', maxWidth: layout.maxContentWidth }
        ]}
        refreshing={loading}
        onRefresh={loadProducts}
        ListHeaderComponent={(
          <Card style={[screenShell.heroCard, styles.heroCard]}>
            <Card.Content>
              <Text style={screenShell.heroEyebrow}>Catalog Control</Text>
              <Text variant="headlineSmall" style={screenShell.heroTitle}>Manage products, pricing, and stock entries</Text>
              <Text style={screenShell.heroCopy}>Use the same Charlie PC mobile shell to add products, review stock counts, and update catalog details from the cashier or admin side.</Text>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No products found.</Text> : null}
        renderItem={({ item }) => (
          <View style={layout.adminColumns > 1 ? styles.cardSlotDouble : styles.cardSlotSingle}>
            <Card style={[screenShell.sectionCard, styles.card]}>
              {item.image ? <Card.Cover source={{ uri: item.image }} style={styles.productCover} /> : null}
              <Card.Title title={item.name} subtitle={item.category || 'Uncategorized'} titleNumberOfLines={2} />
              <Card.Content>
                <View style={styles.metricRow}>
                  <View style={styles.metricPill}>
                    <Text style={styles.metricLabel}>Price</Text>
                    <Text style={styles.metricValue}>{formatCurrency(item.price || 0)}</Text>
                  </View>
                  <View style={styles.metricPill}>
                    <Text style={styles.metricLabel}>Stock</Text>
                    <Text style={styles.metricValue}>{formatNumber(item.stock || 0)}</Text>
                  </View>
                </View>
                {item.barcode ? <Text style={styles.meta}>Barcode: {item.barcode}</Text> : null}
                {!canEditDelete ? <Text style={styles.metaNote}>Cashier can add products only.</Text> : null}
              </Card.Content>
              {canEditDelete ? (
                <Card.Actions style={styles.cardActions}>
                  <Button mode="contained-tonal" onPress={() => openEdit(item)}>Edit</Button>
                  <Button
                    mode="outlined"
                    textColor="#B42318"
                    onPress={() => askDelete(item)}
                    style={styles.deleteButton}
                    contentStyle={styles.deleteButtonContent}
                  >
                    Delete
                  </Button>
                </Card.Actions>
              ) : null}
            </Card>
          </View>
        )}
      />

      <FAB icon="plus" style={styles.fab} onPress={openAdd} label="Add Product" />

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)} style={layout.isExpanded ? styles.dialogWide : undefined}>
          <Dialog.Title>{editing ? 'Edit Product' : 'Add Product'}</Dialog.Title>
          <Dialog.Content>
            <TextInput label="Name" mode="outlined" value={form.name} onChangeText={(v) => setForm((p) => ({ ...p, name: v }))} style={styles.input} />
            <Menu
              visible={categoryMenuVisible}
              onDismiss={() => setCategoryMenuVisible(false)}
              contentStyle={styles.categoryMenu}
              anchor={(
                <Pressable onPress={() => setCategoryMenuVisible(true)}>
                  <View pointerEvents="none">
                    <TextInput
                      label="Category"
                      mode="outlined"
                      value={form.category}
                      editable={false}
                      style={styles.input}
                      right={<TextInput.Icon icon="chevron-down" />}
                    />
                  </View>
                </Pressable>
              )}
            >
              {PRODUCT_CATEGORIES.map((category) => (
                <Menu.Item
                  key={category}
                  title={category}
                  onPress={() => {
                    setForm((p) => ({ ...p, category }));
                    setCategoryMenuVisible(false);
                  }}
                />
              ))}
            </Menu>
            <HelperText type="info" visible style={styles.formHelper}>
              Add a custom product photo, or leave it blank and we will use the category image.
            </HelperText>
            <View style={styles.imagePanel}>
              {form.imagePreview ? (
                <Image source={{ uri: form.imagePreview }} style={styles.imagePreview} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imagePlaceholderTitle}>No custom photo selected</Text>
                  <Text style={styles.imagePlaceholderCopy}>The selected category photo will be used after saving.</Text>
                </View>
              )}
              <View style={styles.imageActions}>
                <Button mode="contained-tonal" icon="image" onPress={() => selectProductImage('library')} style={styles.imageActionButton}>
                  Choose Photo
                </Button>
                <Button mode="outlined" icon="camera" onPress={() => selectProductImage('camera')} style={styles.imageActionButton}>
                  Take Photo
                </Button>
              </View>
              {form.imagePreview || (editing && !form.resetImage) ? (
                <Button mode="text" textColor="#2457A6" onPress={resetProductImage} compact>
                  Use Category Photo
                </Button>
              ) : null}
            </View>
            <TextInput label="Price" mode="outlined" keyboardType="decimal-pad" value={form.price} onChangeText={(v) => setForm((p) => ({ ...p, price: v }))} style={styles.input} />
            <TextInput label="Stock" mode="outlined" keyboardType="number-pad" value={form.stock} onChangeText={(v) => setForm((p) => ({ ...p, stock: v }))} style={styles.input} />
            <TextInput label="Barcode" mode="outlined" value={form.barcode} onChangeText={(v) => setForm((p) => ({ ...p, barcode: v }))} style={styles.input} />
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
  heroCard: {
    marginBottom: 12
  },
  columnWrap: {
    justifyContent: 'space-between',
    gap: 12
  },
  cardSlotSingle: {
    width: '100%',
    marginBottom: 12
  },
  cardSlotDouble: {
    width: '48.8%',
    marginBottom: 12
  },
  card: {
    borderRadius: 22
  },
  productCover: {
    height: 148,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: '#EAF0FA'
  },
  metricRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 4
  },
  metricPill: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#F6F8FC',
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  metricLabel: {
    color: '#667085',
    fontSize: 12,
    marginBottom: 2
  },
  metricValue: {
    color: '#163567',
    fontWeight: '700'
  },
  meta: {
    ...screenShell.metaText,
    marginTop: 8
  },
  metaNote: {
    ...screenShell.metaText,
    marginTop: 8
  },
  cardActions: {
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12
  },
  deleteButton: {
    borderColor: '#F3B7B2',
    backgroundColor: '#FDECEA'
  },
  deleteButtonContent: {
    minWidth: 92
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16
  },
  input: {
    marginBottom: 8,
    backgroundColor: '#FFFFFF'
  },
  categoryMenu: {
    borderRadius: 18
  },
  formHelper: {
    marginTop: -4,
    marginBottom: 6,
    color: '#667085'
  },
  imagePanel: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D9E2F1',
    backgroundColor: '#F8FAFE',
    padding: 12,
    marginBottom: 12,
    gap: 10
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    backgroundColor: '#E7EEF9'
  },
  imagePlaceholder: {
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#C8D4E6',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 18,
    gap: 4
  },
  imagePlaceholderTitle: {
    color: '#183567',
    fontWeight: '700'
  },
  imagePlaceholderCopy: {
    color: '#667085',
    lineHeight: 18
  },
  imageActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  imageActionButton: {
    flexGrow: 1
  },
  dialogWide: {
    alignSelf: 'center',
    width: 680
  },
  empty: {
    ...screenShell.emptyText,
    marginTop: 24
  }
});
