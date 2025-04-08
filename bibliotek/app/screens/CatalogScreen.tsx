import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { fetchBooks } from "../services/apiService.js";

const CatalogScreen = () => {
  interface Book {
    id: number;
    title: string;
    author: string;
  }
  
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBooks = async () => {
      try {
        const data = await fetchBooks();
        setBooks(data);
      } catch (error) {
        console.error("Erreur lors du chargement des livres :", error);
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#1e3a8a" />;
  }

  return (
    <View>
      <FlatList
        data={books}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View>
            <Text>{item.title}</Text>
            <Text>{item.author}</Text>
          </View>
        )}
      />
    </View>
  );
};

export default CatalogScreen;