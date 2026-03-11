import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Searchbar, Snackbar, Text } from 'react-native-paper';
import { getProducts } from '../api/client';
import { useCart } from '../context/CartContext';
import { formatCurrency, formatNumber } from '../utils/format';

export default function ProductsScreen() {
  const { addItem } = useCart();
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [snack, setSnack] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts(typedQuery = query) {
    setError('');
    setLoading(true);
    try {
      const data = await getProducts(typedQuery);
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    try {
      const data = await getProducts(query);
      setProducts(Array.isArray(data) ? data : []);
      setError('');
    } catch (e) {
      setError(e.message || 'Failed to refresh products');
    } finally {
      setRefreshing(false);
    }
  }

  function onAdd(product) {
    if (Number(product.stock || 0) <= 0) {
      setSnack('This product is out of stock.');
      return;
    }
    addItem(product);
    setSnack(`Added ${product.name}`);
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search products"
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={() => loadProducts(query)}
        style={styles.search}
      />

      <View style={styles.actionsRow}>
        <Button mode="contained-tonal" onPress={() => loadProducts(query)}>Search</Button>
        <Button onPress={() => { setQuery(''); loadProducts(''); }}>Clear</Button>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No products found.</Text> : null}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            {item.image ? <Card.Cover source={{ uri: item.image }} style={styles.cover} /> : null}
            <Card.Title title={item.name} subtitle={item.category || 'Uncategorized'} />
            <Card.Content>
              <View style={styles.metaRow}>
                <Chip compact>{formatCurrency(item.price || 0)}</Chip>
                <Chip compact textStyle={{ color: Number(item.stock || 0) <= 3 ? '#B54708' : '#475467' }}>
                  Stock: {formatNumber(item.stock || 0)}
                </Chip>
              </View>
            </Card.Content>
            <Card.Actions>
              <Button mode="contained" onPress={() => onAdd(item)} disabled={Number(item.stock || 0) <= 0}>
                Add to Cart
              </Button>
            </Card.Actions>
          </Card>
        )}
      />

      <Snackbar visible={Boolean(snack)} onDismiss={() => setSnack('')} duration={1800}>
        {snack}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6FA',
    paddingHorizontal: 12,
    paddingTop: 12
  },
  search: {
    borderRadius: 14
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: 8
  },
  listContent: {
    paddingBottom: 20,
    gap: 10
  },
  card: {
    borderRadius: 14,
    overflow: 'hidden'
  },
  cover: {
    height: 150
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4
  },
  error: {
    color: '#B42318',
    marginBottom: 8
  },
  empty: {
    textAlign: 'center',
    marginTop: 28,
    color: '#667085'
  }
});
