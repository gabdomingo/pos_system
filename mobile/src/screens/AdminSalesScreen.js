import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Button, Card, Dialog, Divider, Portal, Snackbar, Text } from 'react-native-paper';
import { getSaleById, getSales } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { screenShell } from '../styles/screenShell';
import { formatCurrency, formatNumber } from '../utils/format';
import { useResponsiveLayout } from '../utils/responsive';

function SaleDetailRow({ label, value, stacked = false, emphasized = false }) {
  if (value === undefined || value === null || value === '') return null;

  return (
    <View style={[styles.detailRow, stacked && styles.detailRowStacked]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, stacked && styles.detailValueStacked, emphasized && styles.detailValueStrong]}>
        {value}
      </Text>
    </View>
  );
}

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
                <Text variant="titleMedium" style={styles.saleAmount}>{formatCurrency(item.total || 0)}</Text>
                <Text style={styles.meta}>Payment: {item.paymentMethod || '-'}</Text>
                <Text style={styles.meta}>Status: {item.status || 'completed'}</Text>
              </Card.Content>
              <Card.Actions style={styles.cardActions}>
                <Button mode="contained-tonal" onPress={() => openDetail(item.id)}>View Details</Button>
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
              <View style={styles.detailCard}>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailHeaderLabel}>Receipt Total</Text>
                  <Text variant="headlineSmall" style={styles.detailHeaderTotal}>{formatCurrency(selected.total || 0)}</Text>
                </View>

                <View style={styles.detailSection}>
                  <SaleDetailRow label="Receipt" value={selected.receiptNumber || selected.receipt_number || '-'} />
                  <SaleDetailRow label="Status" value={selected.status || 'completed'} />
                  <SaleDetailRow label="Payment" value={selected.paymentMethod || '-'} />
                  <SaleDetailRow label="Fulfillment" value={selected.fulfillmentType || selected.fulfillment_type || '-'} />
                </View>

                {(selected.customerName || selected.customer_name || selected.customerPhone || selected.customer_phone || selected.customerEmail || selected.customer_email || selected.deliveryAddress || selected.delivery_address) ? (
                  <>
                    <Divider style={styles.divider} />
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Customer</Text>
                      <SaleDetailRow label="Name" value={selected.customerName || selected.customer_name} />
                      <SaleDetailRow label="Phone" value={selected.customerPhone || selected.customer_phone} />
                      <SaleDetailRow label="Email" value={selected.customerEmail || selected.customer_email} stacked />
                      <SaleDetailRow label="Address" value={selected.deliveryAddress || selected.delivery_address} stacked />
                    </View>
                  </>
                ) : null}

                {(selected.paymentReference || selected.payment_reference || selected.paymentLast4 || selected.payment_last4) ? (
                  <>
                    <Divider style={styles.divider} />
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Payment Reference</Text>
                      <SaleDetailRow
                        label="Reference"
                        value={selected.paymentReference || selected.payment_reference || `Card ending in ${selected.paymentLast4 || selected.payment_last4}`}
                        stacked
                      />
                    </View>
                  </>
                ) : null}

                <Divider style={styles.divider} />
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Items</Text>
                  {(selected.items || []).map((item, idx) => (
                    <View key={`${item.id || idx}-${idx}`} style={styles.itemDetailRow}>
                      <View style={styles.itemDetailCopy}>
                        <Text style={styles.itemDetailName}>
                          {item.productName || item.product_name || (item.product_id != null ? `Product #${formatNumber(item.product_id, { maximumFractionDigits: 0 })}` : 'Product')}
                        </Text>
                        <Text style={styles.itemDetailMeta}>Qty {formatNumber(item.quantity)}</Text>
                      </View>
                      <Text style={styles.itemDetailAmount}>{formatCurrency(item.lineTotal || item.line_total || 0)}</Text>
                    </View>
                  ))}
                  {(!selected.items || selected.items.length === 0) ? <Text style={styles.meta}>No items found</Text> : null}
                </View>

                <Divider style={styles.divider} />
                <View style={styles.detailSection}>
                  <SaleDetailRow label="Subtotal" value={formatCurrency(selected.subtotal || 0)} />
                  {Number(selected.discountAmount || selected.discount_amount || 0) > 0 ? (
                    <SaleDetailRow label="Discount" value={formatCurrency(selected.discountAmount || selected.discount_amount || 0)} />
                  ) : null}
                  {Number(selected.taxAmount || selected.tax_amount || 0) > 0 ? (
                    <SaleDetailRow label="Tax" value={formatCurrency(selected.taxAmount || selected.tax_amount || 0)} />
                  ) : null}
                  <SaleDetailRow
                    label="Tendered"
                    value={formatCurrency(selected.amountTendered || selected.amount_tendered || selected.total || 0)}
                    emphasized
                  />
                  <SaleDetailRow label="Change" value={formatCurrency(selected.changeAmount || selected.change_amount || 0)} />
                </View>
              </View>
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
  saleAmount: {
    color: '#163567'
  },
  cardActions: {
    paddingHorizontal: 12,
    paddingBottom: 12
  },
  meta: {
    ...screenShell.metaText,
    marginTop: 4
  },
  divider: {
    marginVertical: 10
  },
  detailCard: {
    borderRadius: 18,
    backgroundColor: '#F8FAFE',
    padding: 16
  },
  detailHeader: {
    borderRadius: 18,
    backgroundColor: '#163567',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8
  },
  detailHeaderLabel: {
    color: '#C8D8F7',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12
  },
  detailHeaderTotal: {
    color: '#FFFFFF',
    marginTop: 6
  },
  detailSection: {
    gap: 8
  },
  detailSectionTitle: {
    color: '#18355E',
    fontWeight: '700',
    marginBottom: 2
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12
  },
  detailRowStacked: {
    flexDirection: 'column',
    gap: 4
  },
  detailLabel: {
    color: '#667085'
  },
  detailValue: {
    flex: 1,
    color: '#18355E',
    textAlign: 'right'
  },
  detailValueStacked: {
    textAlign: 'left'
  },
  detailValueStrong: {
    fontWeight: '700'
  },
  itemDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 4
  },
  itemDetailCopy: {
    flex: 1
  },
  itemDetailName: {
    color: '#18355E',
    fontWeight: '600'
  },
  itemDetailMeta: {
    color: '#667085',
    marginTop: 2
  },
  itemDetailAmount: {
    color: '#18355E',
    fontWeight: '700'
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
