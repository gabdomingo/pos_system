import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Chip, Text } from 'react-native-paper';
import { getDashboard } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatNumber } from '../utils/format';

function StatCard({ label, value }) {
  return (
    <Card style={styles.statCard}>
      <Card.Content>
        <Text style={styles.statLabel}>{label}</Text>
        <Text variant="headlineSmall">{value}</Text>
      </Card.Content>
    </Card>
  );
}

export default function AdminDashboardScreen() {
  const { token } = useAuth();
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
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
    >
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.grid}>
        <StatCard label="Products" value={formatNumber(data?.totalProducts ?? 0)} />
        <StatCard label="Low Stock" value={formatNumber(data?.lowStock ?? 0)} />
        <StatCard label="Sales Today" value={formatNumber(data?.totalSalesToday ?? 0)} />
        <StatCard label="Revenue Today" value={formatCurrency(data?.revenueToday || 0)} />
      </View>

      <Card style={styles.panel}>
        <Card.Title title="Top Products" />
        <Card.Content>
          {(data?.topProducts || []).map((product) => (
            <View key={product.id} style={styles.row}>
              <Text>{product.name}</Text>
              <Chip compact>{formatNumber(product.qty_sold || 0)} sold</Chip>
            </View>
          ))}
          {(!data?.topProducts || data.topProducts.length === 0) ? <Text style={styles.empty}>No sales yet</Text> : null}
        </Card.Content>
      </Card>

      <Card style={styles.panel}>
        <Card.Title title="Recent Transactions" />
        <Card.Content>
          {(data?.recentTransactions || []).map((sale) => (
            <View key={sale.id} style={styles.saleRow}>
              <View>
                <Text variant="labelLarge">Sale #{formatNumber(sale.id, { maximumFractionDigits: 0 })}</Text>
                <Text style={styles.meta}>{new Date(sale.createdAt).toLocaleString()}</Text>
              </View>
              <Text variant="titleMedium">{formatCurrency(sale.total || 0)}</Text>
            </View>
          ))}
          {(!data?.recentTransactions || data.recentTransactions.length === 0) ? <Text style={styles.empty}>No transactions yet</Text> : null}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6FA'
  },
  content: {
    padding: 12,
    gap: 10,
    paddingBottom: 20
  },
  error: {
    color: '#B42318'
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  statCard: {
    width: '48%',
    borderRadius: 12
  },
  statLabel: {
    color: '#667085',
    marginBottom: 6
  },
  panel: {
    borderRadius: 14
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  saleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  meta: {
    color: '#667085'
  },
  empty: {
    color: '#667085',
    marginTop: 4
  }
});
