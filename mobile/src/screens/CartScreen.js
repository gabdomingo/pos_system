import React, { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, IconButton, SegmentedButtons, Snackbar, Text } from 'react-native-paper';
import { createSale } from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatNumber } from '../utils/format';

export default function CartScreen() {
  const { items, subtotal, removeItem, updateQuantity, clearCart } = useCart();
  const { token } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [processing, setProcessing] = useState(false);
  const [snack, setSnack] = useState('');

  async function checkout() {
    if (items.length === 0) {
      setSnack('Your cart is empty.');
      return;
    }

    setProcessing(true);
    try {
      const payload = {
        items: items.map((item) => ({ id: item.id, quantity: item.quantity, price: Number(item.price || 0) })),
        total: subtotal,
        paymentMethod
      };
      const result = await createSale(payload, token || undefined);
      clearCart();
      setSnack(`Sale submitted (ID: ${result?.saleId ? formatNumber(result.saleId, { maximumFractionDigits: 0 }) : 'n/a'})`);
    } catch (e) {
      setSnack(e.message || 'Checkout failed');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <View style={styles.container}>
      <Card style={styles.summaryCard}>
        <Card.Title title="Cart Summary" />
        <Card.Content>
          <Text variant="titleLarge">{formatCurrency(subtotal)}</Text>
          <Text variant="bodyMedium" style={styles.summaryMeta}>{formatNumber(items.length)} line item(s)</Text>
          <SegmentedButtons
            value={paymentMethod}
            onValueChange={setPaymentMethod}
            buttons={[
              { value: 'Cash', label: 'Cash' },
              { value: 'Card', label: 'Card' },
              { value: 'E-Wallet', label: 'E-Wallet' }
            ]}
            style={styles.segment}
          />
          <Button mode="contained" onPress={checkout} loading={processing} disabled={processing || items.length === 0}>
            Checkout
          </Button>
        </Card.Content>
      </Card>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.empty}>No items in cart yet.</Text>}
        renderItem={({ item }) => (
          <Card style={styles.itemCard}>
            <Card.Content>
              <Text variant="titleMedium">{item.name}</Text>
              <Text variant="bodySmall" style={styles.itemMeta}>{formatCurrency(item.price || 0)} each</Text>
              <View style={styles.qtyRow}>
                <IconButton icon="minus" size={18} onPress={() => updateQuantity(item.id, item.quantity - 1)} />
                <Text variant="titleMedium">{formatNumber(item.quantity)}</Text>
                <IconButton icon="plus" size={18} onPress={() => updateQuantity(item.id, item.quantity + 1)} />
                <View style={styles.grow} />
                <Button compact onPress={() => removeItem(item.id)}>Remove</Button>
              </View>
              <Divider style={styles.divider} />
              <Text variant="labelLarge">Line Total: {formatCurrency(Number(item.price || 0) * Number(item.quantity || 0))}</Text>
            </Card.Content>
          </Card>
        )}
      />

      <Snackbar visible={Boolean(snack)} onDismiss={() => setSnack('')} duration={2200}>
        {snack}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6FA',
    padding: 12
  },
  summaryCard: {
    borderRadius: 14,
    marginBottom: 10
  },
  summaryMeta: {
    color: '#667085',
    marginBottom: 10
  },
  segment: {
    marginBottom: 12
  },
  listContent: {
    paddingBottom: 20,
    gap: 10
  },
  itemCard: {
    borderRadius: 14
  },
  itemMeta: {
    color: '#667085',
    marginTop: 2
  },
  qtyRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center'
  },
  grow: {
    flex: 1
  },
  divider: {
    marginVertical: 8
  },
  empty: {
    textAlign: 'center',
    color: '#667085',
    marginTop: 20
  }
});
