export interface Book {
    id: string;
    title: string;
    author: string;
    coverImage: string;
    description: string;
    isbn: string;
    publishedYear: number;
    genre: string;
    available: boolean;
    dueDate?: string;
  }
  
  export interface User {
    id: string;
    name: string;
    email: string;
    borrowedBooks: string[]; // Array of book IDs
  }