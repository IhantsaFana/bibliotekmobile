import axios from "axios";
import API_URL from "../config.js";

const api = axios.create({
  baseURL: API_URL,
  timeout: 5000, // Temps limite pour les requêtes
});

// Exemple : Récupérer la liste des livres
export const fetchBooks = async () => {
  try {
    const response = await api.get("/books");
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la récupération des livres :", error);
    throw error;
  }
};

// Exemple : Ajouter un livre
export const addBook = async (bookData) => {
  try {
    const response = await api.post("/books", bookData);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de l'ajout d'un livre :", error);
    throw error;
  }
};