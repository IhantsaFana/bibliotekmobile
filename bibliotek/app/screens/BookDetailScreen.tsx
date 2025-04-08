import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import bookService, { Book } from '../services/bookService';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RouteParams = {
  BookDetail: {
    book: Book & {
      titre?: string;
      auteurs?: string[];
      description?: string;
      publishedDate?: string;
      categories?: string[];
      thumbnail?: string;
    };
  };
};

const BookDetailScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<RouteParams, 'BookDetail'>>();
  const { book } = route.params;
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleBorrow = async () => {
    try {
      setIsLoading(true);
      
      // Get user ID from AsyncStorage (you might store it during login)
      const userId = await AsyncStorage.getItem('user_id');
      
      if (!userId) {
        Alert.alert('Error', 'You need to be logged in to borrow books');
        return;
      }
      
      // Create a reservation
      await bookService.createReservation({
        utilisateur: parseInt(userId),
        ouvrage: book.id,
        statut: 'En attente'
      });
      
      // Navigate to borrow screen
      navigation.navigate('BorrowBook', { book });
    } catch (error) {
      console.error('Error creating reservation:', error);
      Alert.alert('Error', 'Failed to create reservation. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={() => setIsFavorite(!isFavorite)}
        >
          <Ionicons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={24} 
            color={isFavorite ? "#EF4444" : "#1F2937"} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.bookContainer}>
          <Image 
            source={{ 
              uri: book.thumbnail || 'https://via.placeholder.com/180x260?text=No+Cover' 
            }} 
            style={styles.bookCover} 
          />
          <Text style={styles.bookTitle}>{book.titre || 'Unknown Title'}</Text>
          <Text style={styles.bookAuthor}>
            {book.auteurs ? book.auteurs.join(', ') : 'Unknown Author'}
          </Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={18} color="#FFD700" />
            <Text style={styles.ratingText}>4.5 (120 reviews)</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>
            {book.description || 'No description available for this book.'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>ISBN</Text>
              <Text style={styles.detailValue}>{book.isbn}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Published</Text>
              <Text style={styles.detailValue}>{book.publishedDate || 'Unknown'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Categories</Text>
              <Text style={styles.detailValue}>
                {book.categories ? book.categories.join(', ') : 'Unknown'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.borrowButton}
          onPress={handleBorrow}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.borrowButtonText}>Borrow Book</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    padding: 8,
  },
  favoriteButton: {
    padding: 8,
  },
  bookContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  bookCover: {
    width: 180,
    height: 260,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: '#F3F4F6',
  },
  bookTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  bookAuthor: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  borrowButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  borrowButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BookDetailScreen;