import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Chip, Text } from 'react-native-paper';
import { getDashboard } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { screenShell } from '../styles/screenShell';
import { formatCurrency, formatNumber } from '../utils/format';
import { useResponsiveLayout } from '../utils/responsive';

function StatCard({ label, value, style }) {
  return (
    <Card style={[screenShell.sectionCardSoft, styles.statCard, style]}>
      <Card.Content>
        <Text style={styles.statLabel}>{label}</Text>
        <Text variant="headlineSmall" style={styles.statValue}>{value}</Text>
      </Card.Content>
    </Card>
  );
}

export default function AdminDashboardScreen() {
  const { token } = useAuth();
  const layout = useResponsiveLayout();
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setError('');
    setRefreshing(true);
    try {
      const result = await getDashboard(token);
      setData(result);
    } catch (e) {
      setError(e.message || 'Failed to load dashboard');
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <ScrollView
      style={screenShell.container}
      contentContainerStyle={[
        screenShell.content,
        { paddingHorizontal: layout.screenPadding, alignSelf: 'center', width: '100%', maxWidth: layout.maxContentWidth }
      ]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
    >
      <Card style={screenShell.heroCard}>
        <Card.Content>
          <Text style={screenShell.heroEyebrow}>Admin Overview</Text>
          <Text variant="headlineSmall" style={screenShell.heroTitle}>Track Charlie PC activity in one place</Text>
          <Text style={screenShell.heroCopy}>Review product counts, low-stock alerts, recent receipts, and today&apos;s revenue using the same mobile shell as the rest of the app.</Text>
        </Card.Content>
      </Card>

      {error ? <Text style={screenShell.errorText}>{error}</Text> : null}

      <View style={styles.grid}>
        <StatCard label="Products" value={formatNumber(data?.totalProducts ?? 0)} style={getStatCardStyle(layout.statColumns)} />
        <StatCard label="Low Stock" value={formatNumber(data?.lowStock ?? 0)} style={getStatCardStyle(layout.statColumns)} />
        <StatCard label="Sales Today" value={formatNumber(data?.totalSalesToday ?? 0)} style={getStatCardStyle(layout.statColumns)} />
        <StatCard label="Revenue Today" value={formatCurrency(data?.revenueToday || 0)} style={getStatCardStyle(layout.statColumns)} />
      </View>

      <View style={[styles.panelsGrid, layout.isExpanded && styles.panelsGridWide]}>
        <Card style={[screenShell.sectionCard, styles.panel, layout.isExpanded && styles.panelWide]}>
          <Card.Title title="Top Products" subtitle="Best-selling items today" />
          <Card.Content>
            {(data?.topProducts || []).map((product) => (
              <View key={product.id} style={styles.rowCard}>
                <View style={styles.row}>
                  <Text style={styles.rowCopy}>{product.name}</Text>
                  <Chip compact style={styles.dataChip}>{formatNumber(product.qty_sold || 0)} sold</Chip>
                </View>
              </View>
            ))}
            {(!data?.topProducts || data.topProducts.length === 0) ? <Text style={styles.empty}>No sales yet</Text> : null}
          </Card.Content>
        </Card>

        <Card style={[screenShell.sectionCard, styles.panel, layout.isExpanded && styles.panelWide]}>
          <Card.Title title="Recent Transactions" subtitle="Newest completed receipts" />
          <Card.Content>
            {(data?.recentTransactions || []).map((sale) => (
              <View key={sale.id} style={styles.rowCard}>
                <View style={styles.saleRow}>
                  <View style={styles.saleCopy}>
                    <Text variant="labelLarge">Sale #{formatNumber(sale.id, { maximumFractionDigits: 0 })}</Text>
                    <Text style={styles.meta}>{new Date(sale.createdAt).toLocaleString()}</Text>
                  </View>
                  <Text variant="titleMedium" style={styles.saleValue}>{formatCurrency(sale.total || 0)}</Text>
                </View>
              </View>
            ))}
            {(!data?.recentTransactions || data.recentTransactions.length === 0) ? <Text style={styles.empty}>No transactions yet</Text> : null}
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}

function getStatCardStyle(columns) {
  if (columns >= 4) return styles.statCardQuarter;
  if (columns === 2) return styles.statCardHalf;
  return styles.statCardFull;
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  statCard: {
    borderRadius: 18
  },
  statCardFull: {
    width: '100%'
  },
  statCardHalf: {
    width: '48.8%'
  },
  statCardQuarter: {
    width: '24%'
  },
  statLabel: {
    color: '#667085',
    marginBottom: 6
  },
  statValue: {
    color: '#18355E'
  },
  panelsGrid: {
    gap: 10
  },
  panelsGridWide: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  panel: {
    borderRadius: 22
  },
  panelWide: {
    flex: 1
  },
  rowCard: {
    borderRadius: 18,
    backgroundColor: '#F7F9FD',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12
  },
  rowCopy: {
    flex: 1
  },
  saleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12
  },
  saleCopy: {
    flex: 1
  },
  saleValue: {
    color: '#163567'
  },
  dataChip: {
    backgroundColor: '#E7EEF9'
  },
  meta: {
    ...screenShell.metaText
  },
  empty: {
    ...screenShell.metaText,
    marginTop: 4
  }
});
