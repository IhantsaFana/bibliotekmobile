import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import bookService, { Emprunt, Reservation } from '../services/bookService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LibraryScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [activeTab, setActiveTab] = useState('borrowed');
  const [borrowedBooks, setBorrowedBooks] = useState<Emprunt[]>([]);
  const [reservedBooks, setReservedBooks] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserLibrary = async () => {
      try {
        setIsLoading(true);
        
        // Get user ID from AsyncStorage
        const userId = await AsyncStorage.getItem('user_id');
        
        if (!userId) {
          Alert.alert('Error', 'You need to be logged in to view your library');
          return;
        }
        
        const userIdNum = parseInt(userId);
        
        // Fetch user's borrowings and reservations
        const [borrowings, reservations] = await Promise.all([
          bookService.getUserBorrowings(userIdNum),
          bookService.getUserReservations(userIdNum)
        ]);
        
        setBorrowedBooks(borrowings);
        setReservedBooks(reservations);
      } catch (error) {
        console.error('Error fetching library:', error);
        Alert.alert('Error', 'Failed to load your library. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserLibrary();
  }, []);

  const renderBookItem = ({ item }: { item: Emprunt | Reservation }) => {
    // In a real app, you would fetch book details for each item
    // For this example, we'll just use placeholder data
    
    return (
      <TouchableOpacity 
        style={styles.bookItem}
        onPress={() => {
          // Navigate to book detail
          navigation.navigate('BookDetail', { 
            book: {
              id: item.ouvrage,
              isbn: 'Fetching...',
              date_ajout: new Date().toISOString()
            }
          });
        }}
      >
        <Image 
          source={{ uri: 'https://via.placeholder.com/80x120?text=Book+Cover' }} 
          style={styles.bookCover} 
        />
        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle}>Book #{item.ouvrage}</Text>
          <Text style={styles.bookAuthor}>Loading author...</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>4.5</Text>
          </View>
          {'date_retour_prevu' in item && (
            <View style={styles.dueDateContainer}>
              <Text style={styles.dueDateLabel}>Due: </Text>
              <Text style={styles.dueDateText}>{item.date_retour_prevu}</Text>
            </View>
          )}
          {'statut' in item && (
            <View style={styles.statusContainer}>
              <Text style={styles.statusLabel}>Status: </Text>
              <Text 
                style={[
                  styles.statusText,
                  item.statut === 'Confirmée' ? styles.statusConfirmed : 
                  item.statut === 'Annulée' ? styles.statusCancelled : 
                  styles.statusPending
                ]}
              >
                {item.statut}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Library</Text>
        <TouchableOpacity 
          style={styles.scanButton}
          onPress={() => navigation.navigate('ScanBook')}
        >
          <Ionicons name="qr-code-outline" size={24} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'borrowed' && styles.activeTab]}
          onPress={() => setActiveTab('borrowed')}
        >
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'borrowed' && styles.activeTabText
            ]}
          >
            Borrowed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'reserved' && styles.activeTab]}
          onPress={() => setActiveTab('reserved')}
        >
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'reserved' && styles.activeTabText
            ]}
          >
            Reserved
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'borrowed' ? (
        borrowedBooks.length > 0 ? (
          <FlatList
            data={borrowedBooks}
            renderItem={renderBookItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.booksList}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>No Borrowed Books</Text>
            <Text style={styles.emptyStateText}>
              You haven't borrowed any books yet. Browse the library to find books to borrow.
            </Text>
          </View>
        )
      ) : (
        reservedBooks.length > 0 ? (
          <FlatList
            data={reservedBooks}
            renderItem={renderBookItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.booksList}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="bookmark-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>No Reserved Books</Text>
            <Text style={styles.emptyStateText}>
              You haven't reserved any books yet. Browse the library to find books to reserve.
            </Text>
          </View>
        )
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  scanButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    paddingVertical: 12,
    marginRight: 24,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2563EB',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#2563EB',
  },
  booksList: {
    padding: 20,
  },
  bookItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  bookCover: {
    width: 80,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  bookInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#6B7280',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDateLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  dueDateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusConfirmed: {
    color: '#10B981',
  },
  statusPending: {
    color: '#F59E0B',
  },
  statusCancelled: {
    color: '#EF4444',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 300,
  },
});

export default LibraryScreen;