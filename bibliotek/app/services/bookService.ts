import api from './api';

export interface Book {
  id: number;
  isbn: string;
  date_ajout: string;
  // Additional fields from Google Books API
  titre?: string;
  auteurs?: string[];
  description?: string;
  publishedDate?: string;
  categories?: string[];
  thumbnail?: string;
}

export interface Reservation {
  id: number;
  utilisateur: number;
  ouvrage: number;
  date_reservation: string;
  date_retour_prevu: string | null;
  statut: 'En attente' | 'Confirmée' | 'Annulée';
}

export interface Emprunt {
  id: number;
  utilisateur: number;
  ouvrage: number;
  date_emprunt: string;
  date_retour_prevu: string;
  date_retour_effective: string | null;
}

export interface Notification {
  id: number;
  utilisateur: number;
  message: string;
  date_envoi: string;
  lu: boolean;
}

const bookService = {
  // Books
  getAllBooks: async () => {
    try {
      const response = await api.get<Book[]>('ouvrages/');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getBookById: async (id: number) => {
    try {
      const response = await api.get<Book>(`ouvrages/${id}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getBookDetails: async (id: number) => {
    try {
      const response = await api.get(`ouvrages/${id}/details/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Reservations
  createReservation: async (data: Partial<Reservation>) => {
    try {
      const response = await api.post<Reservation>('reservations/', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getUserReservations: async (userId: number) => {
    try {
      const response = await api.get<Reservation[]>(`reservations/?utilisateur=${userId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Borrowings
  getUserBorrowings: async (userId: number) => {
    try {
      const response = await api.get<Emprunt[]>(`emprunts/?utilisateur=${userId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Notifications
  getUserNotifications: async (userId: number) => {
    try {
      const response = await api.get<Notification[]>(`notifications/?utilisateur=${userId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  markNotificationAsRead: async (id: number) => {
    try {
      const response = await api.patch<Notification>(`notifications/${id}/`, { lu: true });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default bookService;