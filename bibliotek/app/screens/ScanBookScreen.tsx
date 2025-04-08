import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import bookService from '../services/bookService';

const ScanBookScreen = () => {
  const navigation = useNavigation();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getBarCodeScannerPermissions();
  }, []);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    
    try {
      setIsLoading(true);
      
      // Check if the scanned code is an ISBN
      if (data.match(/^[0-9]{10,13}$/)) {
        // Search for the book by ISBN
        const books = await bookService.getAllBooks();
        const book = books.find(b => b.isbn === data);
        
        if (book) {
          // Get book details
          const bookDetails = await bookService.getBookDetails(book.id);
          
          // Navigate to book detail
          navigation.navigate('BookDetail', { 
            book: {
              ...book,
              ...bookDetails
            }
          });
        } else {
          Alert.alert(
            'Book Not Found',
            'This book is not in our database. Would you like to add it?',
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => setScanned(false)
              },
              {
                text: 'Add Book',
                onPress: () => {
                  // In a real app, you would navigate to an "Add Book" screen
                  Alert.alert('Feature Coming Soon', 'Adding new books will be available in a future update.');
                  setScanned(false);
                }
              }
            ]
          );
        }
      } else if (data.startsWith('book:')) {
        // This is a borrowing QR code
        const parts = data.split(':');
        const bookId = parseInt(parts[1]);
        const duration = parts[3] ? parseInt(parts[3]) : 7;
        
        // In a real app, you would handle the borrowing process here
        Alert.alert(
          'Book Borrowing',
          `You are about to borrow book #${bookId} for ${duration} days.`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setScanned(false)
            },
            {
              text: 'Confirm',
              onPress: () => {
                Alert.alert('Success', 'Book borrowed successfully!');
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Invalid Code',
          'The scanned code is not a valid book code.',
          [
            {
              text: 'OK',
              onPress: () => setScanned(false)
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error processing scanned code:', error);
      Alert.alert('Error', 'Failed to process the scanned code. Please try again.');
      setScanned(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text>Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text>No access to camera</Text>
        <TouchableOpacity 
          style={styles.permissionButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.permissionButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Book</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <View style={styles.scannerContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        ) : (
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />
        )}
        
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
          <Text style={styles.scanText}>
            Align the QR code or barcode within the frame
          </Text>
        </View>
      </View>
      
      {scanned && !isLoading && (
        <TouchableOpacity 
          style={styles.scanAgainButton}
          onPress={() => setScanned(false)}
        >
          <Text style={styles.scanAgainButtonText}>Scan Again</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 20,
  },
  scanText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  scanAgainButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    margin: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  scanAgainButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
});

export default ScanBookScreen;