import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Searchbar, Snackbar, Text } from 'react-native-paper';
import { getProducts } from '../api/client';
import { useCart } from '../context/CartContext';
import { screenShell } from '../styles/screenShell';
import { formatCurrency, formatNumber } from '../utils/format';
import { useResponsiveLayout } from '../utils/responsive';

export default function ProductsScreen() {
  const { addItem } = useCart();
  const layout = useResponsiveLayout();
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
    <View style={[screenShell.container, { paddingHorizontal: layout.screenPadding, paddingTop: layout.screenPadding }]}>
      <Card style={screenShell.heroCard}>
        <Card.Content>
          <Text style={screenShell.heroEyebrow}>Charlie PC Storefront</Text>
          <Text variant="headlineSmall" style={screenShell.heroTitle}>Shop parts with live stock and quick add-to-cart access</Text>
          <Text style={screenShell.heroCopy}>Search the catalog, compare available products, and add items to the cart using the same Charlie PC mobile shell.</Text>
        </Card.Content>
      </Card>

      <Card style={[screenShell.sectionCard, styles.toolbarCard]}>
        <Card.Content>
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

          {error ? <Text style={screenShell.errorText}>{error}</Text> : null}
        </Card.Content>
      </Card>

      <FlatList
        key={layout.productColumns}
        data={products}
        keyExtractor={(item) => String(item.id)}
        numColumns={layout.productColumns}
        columnWrapperStyle={layout.productColumns > 1 ? styles.columnWrap : undefined}
        contentContainerStyle={[
          styles.listContent,
          { alignSelf: 'center', width: '100%', maxWidth: layout.maxContentWidth }
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No products found.</Text> : null}
        renderItem={({ item }) => (
          <View style={getCardSlotStyle(layout.productColumns)}>
            <Card style={[screenShell.sectionCard, styles.card]}>
              {item.image ? <Card.Cover source={{ uri: item.image }} style={[styles.cover, layout.productColumns > 1 && styles.coverWide]} /> : null}
              <Card.Title title={item.name} subtitle={item.category || 'Uncategorized'} titleNumberOfLines={2} subtitleNumberOfLines={1} />
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
          </View>
        )}
      />

      <Snackbar visible={Boolean(snack)} onDismiss={() => setSnack('')} duration={1800}>
        {snack}
      </Snackbar>
    </View>
  );
}

function getCardSlotStyle(columns) {
  if (columns >= 3) return styles.cardSlotTriple;
  if (columns === 2) return styles.cardSlotDouble;
  return styles.cardSlotSingle;
}

const styles = StyleSheet.create({
  toolbarCard: {
    marginTop: 12
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
  cardSlotTriple: {
    width: '31.9%',
    marginBottom: 12
  },
  card: {
    overflow: 'hidden'
  },
  cover: {
    height: 150
  },
  coverWide: {
    height: 170
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap'
  },
  empty: {
    ...screenShell.emptyText,
    marginTop: 28
  }
});
