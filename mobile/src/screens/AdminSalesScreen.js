import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Button, Card, Dialog, Divider, Portal, Snackbar, Text } from 'react-native-paper';
import { getSaleById, getSales } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatNumber } from '../utils/format';

export default function AdminSalesScreen() {
  const { token } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [snack, setSnack] = useState('');

  useEffect(() => {
    loadSales();
  }, []);

  async function loadSales() {
    setLoading(true);
    try {
      const data = await getSales(token);
      setSales(Array.isArray(data) ? data : []);
    } catch (e) {
      setSnack(e.message || 'Failed to load sales');
    } finally {
      setLoading(false);
    }
  }

  async function openDetail(id) {
    try {
      const data = await getSaleById(token, id);
      setSelected(data);
    } catch (e) {
      setSnack(e.message || 'Failed to load details');
    }
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sales}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={loadSales}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No sales records yet.</Text> : null}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Title title={`Sale #${formatNumber(item.id, { maximumFractionDigits: 0 })}`} subtitle={new Date(item.createdAt).toLocaleString()} />
            <Card.Content>
              <Text variant="titleMedium">{formatCurrency(item.total || 0)}</Text>
              <Text style={styles.meta}>Payment: {item.paymentMethod || '-'}</Text>
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => openDetail(item.id)}>View Details</Button>
            </Card.Actions>
          </Card>
        )}
      />

      <Portal>
        <Dialog visible={Boolean(selected)} onDismiss={() => setSelected(null)}>
          <Dialog.Title>{selected ? `Sale #${formatNumber(selected.id, { maximumFractionDigits: 0 })}` : 'Sale Detail'}</Dialog.Title>
          <Dialog.Content>
            {selected ? (
              <>
                <Text>Total: {formatCurrency(selected.total || 0)}</Text>
                <Text style={styles.meta}>Payment: {selected.paymentMethod || '-'}</Text>
                <Divider style={styles.divider} />
                <Text variant="titleSmall">Items</Text>
                {(selected.items || []).map((item, idx) => (
                  <Text key={`${item.id || idx}-${idx}`} style={styles.itemRow}>
                    Product #{item.product_id != null ? formatNumber(item.product_id, { maximumFractionDigits: 0 }) : '-'} x {formatNumber(item.quantity)} @ {formatCurrency(item.price || 0)}
                  </Text>
                ))}
                {(!selected.items || selected.items.length === 0) ? <Text style={styles.meta}>No items found</Text> : null}
              </>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSelected(null)}>Close</Button>
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
    gap: 10,
    paddingBottom: 20
  },
  card: {
    borderRadius: 14
  },
  meta: {
    color: '#667085',
    marginTop: 4
  },
  divider: {
    marginVertical: 10
  },
  itemRow: {
    marginTop: 4
  },
  empty: {
    marginTop: 24,
    textAlign: 'center',
    color: '#667085'
  }
});
