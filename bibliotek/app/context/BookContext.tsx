// context/BookContext.tsx - State management
import { Book, User } from '@/types/Book.js';
import React, { createContext, useState, useContext, ReactNode } from 'react';


// Sample data
const SAMPLE_BOOKS: Book[] = [
  {
    id: '1',
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    coverImage: 'https://example.com/mockingbird.jpg',
    description: 'The story of young Scout Finch and her father Atticus, a lawyer who defends a black man accused of rape in the Depression-era South.',
    isbn: '978-0446310789',
    publishedYear: 1960,
    genre: 'Fiction',
    available: true
  },
  {
    id: '2',
    title: '1984',
    author: 'George Orwell',
    coverImage: 'https://example.com/1984.jpg',
    description: 'A dystopian novel set in a totalitarian state where critical thought is suppressed under a surveillance regime.',
    isbn: '978-0451524935',
    publishedYear: 1949,
    genre: 'Science Fiction',
    available: false,
    dueDate: '2023-12-15'
  },
  {
    id: '3',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    coverImage: 'https://example.com/gatsby.jpg',
    description: 'The story of eccentric millionaire Jay Gatsby and his pursuit of Daisy Buchanan, exploring themes of decadence and idealism.',
    isbn: '978-0743273565',
    publishedYear: 1925,
    genre: 'Fiction',
    available: true
  },
  {
    id: '4',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    coverImage: 'https://example.com/pride.jpg',
    description: 'The story of Elizabeth Bennet and her relationship with the proud Mr. Darcy, dealing with issues of manners, upbringing, and marriage.',
    isbn: '978-0141439518',
    publishedYear: 1813,
    genre: 'Romance',
    available: true
  },
  {
    id: '5',
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    coverImage: 'https://example.com/hobbit.jpg',
    description: 'The adventure of Bilbo Baggins, a hobbit who is caught up in a quest for treasure guarded by the dragon Smaug.',
    isbn: '978-0547928227',
    publishedYear: 1937,
    genre: 'Fantasy',
    available: false,
    dueDate: '2023-12-10'
  },
];

const CURRENT_USER: User = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  borrowedBooks: ['2', '5']
};

interface BookContextType {
  books: Book[];
  currentUser: User;
  featuredBooks: Book[];
  searchBooks: (query: string) => Book[];
  borrowBook: (bookId: string) => void;
  returnBook: (bookId: string) => void;
}

const BookContext = createContext<BookContextType | undefined>(undefined);

export const BookProvider = ({ children }: { children: ReactNode }) => {
  const [books, setBooks] = useState<Book[]>(SAMPLE_BOOKS);
  const [currentUser, setCurrentUser] = useState<User>(CURRENT_USER);

  // Calculate featured books (just a sample logic)
  const featuredBooks = books.filter((book, index) => index < 3);

  const searchBooks = (query: string): Book[] => {
    return books.filter(book => 
      book.title.toLowerCase().includes(query.toLowerCase()) || 
      book.author.toLowerCase().includes(query.toLowerCase()) ||
      book.genre.toLowerCase().includes(query.toLowerCase())
    );
  };

  const borrowBook = (bookId: string) => {
    setBooks(books.map(book => 
      book.id === bookId ? { ...book, available: false, dueDate: '2023-12-28' } : book
    ));
    
    setCurrentUser({
      ...currentUser,
      borrowedBooks: [...currentUser.borrowedBooks, bookId]
    });
  };

  const returnBook = (bookId: string) => {
    setBooks(books.map(book => 
      book.id === bookId ? { ...book, available: true, dueDate: undefined } : book
    ));
    
    setCurrentUser({
      ...currentUser,
      borrowedBooks: currentUser.borrowedBooks.filter(id => id !== bookId)
    });
  };

  return (
    <BookContext.Provider value={{ 
      books, 
      currentUser, 
      featuredBooks, 
      searchBooks, 
      borrowBook, 
      returnBook 
    }}>
      {children}
    </BookContext.Provider>
  );
};

export const useBooks = () => {
  const context = useContext(BookContext);
  if (context === undefined) {
    throw new Error('useBooks must be used within a BookProvider');
  }
  return context;
};