import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useBooks } from '../context/BookContext';

const MyBooksScreen = () => {
  const { books, currentUser, returnBook } = useBooks();
  const navigation = useNavigation();

  // Filter books that are borrowed by the current user
  const borrowedBooks = books.filter(book => 
    currentUser.borrowedBooks.includes(book.id)
  );

  const handleReturnBook = (book) => {
    Alert.alert(
      'Return Book',
      `Would you like to return "${book.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Return', 
          onPress: () => {
            returnBook(book.id);
            Alert.alert('Success', `You have returned "${book.title}"`);
          }
        }
      ]
    );
  };

  const renderBorrowedBook = ({ item }) => (
    <View style={styles.bookItem}>
      <TouchableOpacity 
        style={styles.bookDetails}
        onPress={() => navigation.navigate('CatalogStack', { 
          screen: 'BookDetail', 
          params: { book: item } 
        })}
      >
        <View style={styles.bookImageContainer}>
          <View style={styles.bookImagePlaceholder}>
            <Text style={styles.bookImageText}>{item.title.charAt(0)}</Text>
          </View>
        </View>
        <View style={styles.bookContent}>
          <Text style={styles.bookTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.bookAuthor}>{item.author}</Text>
          <View style={styles.dueContainer}>
            <Ionicons name="calendar" size={16} color="#6b7280" />
            <Text style={styles.dueDate}>Due: {item.dueDate}</Text>
          </View>
        </View>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.returnButton}
        onPress={() => handleReturnBook(item)}
      >
        <Text style={styles.returnText}>Return</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Borrowed Books</Text>
        <Text style={styles.headerSubtitle}>
          You have {borrowedBooks.length} book{borrowedBooks.length !== 1 ? 's' : ''} borrowed
        </Text>
      </View>

      <FlatList
        data={borrowedBooks}
        keyExtractor={(item) => item.id}
        renderItem={renderBorrowedBook}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={60} color="#9ca3af" />
            <Text style={styles.emptyText}>You haven't borrowed any books yet</Text>
            <TouchableOpacity 
              style={styles.browseCatalogButton}
              onPress={() => navigation.navigate('CatalogStack', { screen: 'Catalog' })}
            >
              <Text style={styles.browseCatalogText}>Browse Catalog</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 5,
  },
  list: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  bookItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginVertical: 5,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  bookDetails: {
    flex: 1,
    flexDirection: 'row',
  },
  bookImageContainer: {
    width: 80,
    height: 100,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e3a8a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookImageText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  bookContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  bookAuthor: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  dueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  dueDate: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 5,
  },
  returnButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 15,
    justifyContent: 'center',
  },
  returnText: {
    color: 'white',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  browseCatalogButton: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  browseCatalogText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default MyBooksScreen;