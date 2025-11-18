import { View, Text, StyleSheet, FlatList } from 'react-native';

const mockSales = [
  { id: '1', saleNumber: 'SALE-2024-00001', total: 2500, date: '2024-01-15' },
  { id: '2', saleNumber: 'SALE-2024-00002', total: 1800, date: '2024-01-15' },
  { id: '3', saleNumber: 'SALE-2024-00003', total: 3200, date: '2024-01-15' },
];

export default function SalesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ventas</Text>

      <FlatList
        data={mockSales}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.saleCard}>
            <View>
              <Text style={styles.saleNumber}>{item.saleNumber}</Text>
              <Text style={styles.saleDate}>{item.date}</Text>
            </View>
            <Text style={styles.saleTotal}>${item.total}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  saleCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  saleNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  saleDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  saleTotal: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
