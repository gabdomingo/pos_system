import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Button, Card, Dialog, Divider, Portal, Snackbar, Text } from 'react-native-paper';
import { getSaleById, getSales } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { screenShell } from '../styles/screenShell';
import { formatCurrency, formatNumber } from '../utils/format';
import { useResponsiveLayout } from '../utils/responsive';

export default function AdminSalesScreen() {
  const { token } = useAuth();
  const layout = useResponsiveLayout();
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
    <View style={screenShell.container}>
      <FlatList
        key={layout.adminColumns}
        data={sales}
        keyExtractor={(item) => String(item.id)}
        numColumns={layout.adminColumns}
        columnWrapperStyle={layout.adminColumns > 1 ? styles.columnWrap : undefined}
        contentContainerStyle={[
          screenShell.listContent,
          { paddingHorizontal: layout.screenPadding, alignSelf: 'center', width: '100%', maxWidth: layout.maxContentWidth }
        ]}
        refreshing={loading}
        onRefresh={loadSales}
        ListHeaderComponent={(
          <Card style={[screenShell.heroCard, styles.heroCard]}>
            <Card.Content>
              <Text style={screenShell.heroEyebrow}>Sales Records</Text>
              <Text variant="headlineSmall" style={screenShell.heroTitle}>Review receipts, payments, and order history</Text>
              <Text style={screenShell.heroCopy}>Track completed sales with the same Charlie PC mobile presentation used in checkout and product management.</Text>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No sales records yet.</Text> : null}
        renderItem={({ item }) => (
          <View style={layout.adminColumns > 1 ? styles.cardSlotDouble : styles.cardSlotSingle}>
            <Card style={[screenShell.sectionCard, styles.card]}>
              <Card.Title
                title={item.receiptNumber || item.receipt_number || `Sale #${formatNumber(item.id, { maximumFractionDigits: 0 })}`}
                subtitle={new Date(item.createdAt).toLocaleString()}
                titleNumberOfLines={2}
              />
              <Card.Content>
                <Text variant="titleMedium">{formatCurrency(item.total || 0)}</Text>
                <Text style={styles.meta}>Payment: {item.paymentMethod || '-'}</Text>
                <Text style={styles.meta}>Status: {item.status || 'completed'}</Text>
              </Card.Content>
              <Card.Actions>
                <Button onPress={() => openDetail(item.id)}>View Details</Button>
              </Card.Actions>
            </Card>
          </View>
        )}
      />

      <Portal>
        <Dialog visible={Boolean(selected)} onDismiss={() => setSelected(null)} style={layout.isExpanded ? styles.dialogWide : undefined}>
          <Dialog.Title>{selected ? selected.receiptNumber || selected.receipt_number || `Sale #${formatNumber(selected.id, { maximumFractionDigits: 0 })}` : 'Sale Detail'}</Dialog.Title>
          <Dialog.Content>
            {selected ? (
              <>
                <Text>Receipt: {selected.receiptNumber || selected.receipt_number || '-'}</Text>
                <Text>Status: {selected.status || 'completed'}</Text>
                {(selected.paymentReference || selected.payment_reference || selected.paymentLast4 || selected.payment_last4) ? (
                  <Text>Reference: {selected.paymentReference || selected.payment_reference || `Card ending in ${selected.paymentLast4 || selected.payment_last4}`}</Text>
                ) : null}
                <Text>Fulfillment: {selected.fulfillmentType || selected.fulfillment_type || '-'}</Text>
                {(selected.customerName || selected.customer_name) ? (
                  <Text>Customer: {selected.customerName || selected.customer_name}</Text>
                ) : null}
                {(selected.customerPhone || selected.customer_phone) ? (
                  <Text>Phone: {selected.customerPhone || selected.customer_phone}</Text>
                ) : null}
                {(selected.customerEmail || selected.customer_email) ? (
                  <Text>Email: {selected.customerEmail || selected.customer_email}</Text>
                ) : null}
                {(selected.deliveryAddress || selected.delivery_address) ? (
                  <Text>Address: {selected.deliveryAddress || selected.delivery_address}</Text>
                ) : null}
                <Text>Subtotal: {formatCurrency(selected.subtotal || 0)}</Text>
                {Number(selected.discountAmount || selected.discount_amount || 0) > 0 ? (
                  <Text>Discount: {formatCurrency(selected.discountAmount || selected.discount_amount || 0)}</Text>
                ) : null}
                {Number(selected.taxAmount || selected.tax_amount || 0) > 0 ? (
                  <Text>Tax: {formatCurrency(selected.taxAmount || selected.tax_amount || 0)}</Text>
                ) : null}
                <Text>Total: {formatCurrency(selected.total || 0)}</Text>
                <Text style={styles.meta}>Payment: {selected.paymentMethod || '-'}</Text>
                <Text style={styles.meta}>Tendered: {formatCurrency(selected.amountTendered || selected.amount_tendered || selected.total || 0)}</Text>
                <Text style={styles.meta}>Change: {formatCurrency(selected.changeAmount || selected.change_amount || 0)}</Text>
                <Divider style={styles.divider} />
                <Text variant="titleSmall">Items</Text>
                {(selected.items || []).map((item, idx) => (
                  <Text key={`${item.id || idx}-${idx}`} style={styles.itemRow}>
                    {(item.productName || item.product_name || (item.product_id != null ? `Product #${formatNumber(item.product_id, { maximumFractionDigits: 0 })}` : 'Product'))} x {formatNumber(item.quantity)} = {formatCurrency(item.lineTotal || item.line_total || 0)}
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
  meta: {
    ...screenShell.metaText,
    marginTop: 4
  },
  divider: {
    marginVertical: 10
  },
  itemRow: {
    marginTop: 4
  },
  empty: {
    ...screenShell.emptyText,
    marginTop: 24
  },
  dialogWide: {
    alignSelf: 'center',
    width: 720
  }
});
