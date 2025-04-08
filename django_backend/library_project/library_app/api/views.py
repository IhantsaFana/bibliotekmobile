from django.shortcuts import redirect
from rest_framework.response import Response
from rest_framework import status
from library_app.models import CustomUser, Book, Favorite, Borrow
from .serializers import UserSerializer, BorrowedBookSerializer, FavoritedBookSerializer
from .serializers import BookSerializer
from rest_framework.decorators import APIView
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.shortcuts import get_object_or_404
from django.urls import reverse
from django.db import transaction
import datetime
from django.db.models import Q
from .LinkedList import Node,LinkedList

# 404 handler
def handler404(request, exception):
    redirect('home')
    

import requests

def get_book_info_from_google(isbn):
    url = f"https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}"
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        if 'items' in data:
            book_info = data['items'][0]['volumeInfo']
            return {
                'title': book_info.get('title', ''),
                'author': book_info.get('authors', []),
                'publisher': book_info.get('publisher', ''),
                'publishedDate': book_info.get('publishedDate', ''),
                'description': book_info.get('description', ''),
                'cover_image': book_info.get('imageLinks', {}).get('thumbnail', ''),
            }
    return None


# API view for listing API endpoints
class APIEndpoints(APIView):
    def get(self, request):
        # Generate a dictionary of endpoint URLs, descriptions, and access levels
        endpoints = {
            reverse('token_obtain_pair'): {
                'description': 'Get an authentication token (JWT).',
                'access_level': 'Public',  # No specific access level required
            },
            reverse('token_refresh'): {
                'description': 'Refresh an expired authentication token (JWT).',
                'access_level': 'Public',  # No specific access level required
            },
            reverse('users'): {
                'description': 'List all users.',
                'access_level': 'Superuser',  # Requires superuser access
            },
            reverse('user_profile'): {
                'description': 'View user profile information.',
                'access_level': 'Superuser',  # Requires superuser access
            },
            reverse('register'): {
                'description': 'Register a new user account.',
                'access_level': 'Public',  # No specific access level required
            },
        }
        
        # Return the dictionary of URLs, descriptions, and access levels in the response
        return Response(endpoints)
    
# API view for listing users
class UserList(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    def get(self, request):
        # Retrieve a list of all users
        users = CustomUser.objects.all()
        
        # Serialize the user data
        serializer = UserSerializer(users, many=True)
        
        # Return the serialized data in the response
        return Response(serializer.data, status=status.HTTP_200_OK)

# API view for user profile
class UserProfile(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        # Retrieve the user's profile based on the authenticated user's ID
        user = CustomUser.objects.get(id=request.user.id)
        
        # Serialize the user's profile data
        serializer = UserSerializer(user)
        
        # Return the serialized data in the response
        return Response(serializer.data, status=status.HTTP_200_OK)


# API view for user registration
class Register(APIView):
    def post(self, request):
        # Deserialize the request data using the UserSerializer
        serializer = UserSerializer(data=request.data)
        
        # Debugging prints to inspect the request data and serializer validity
        print(request.data)
        print(serializer.is_valid())
        
        if serializer.is_valid():
            # If the serializer data is valid, create a new CustomUser
            user = CustomUser.objects.create_user(
                user_name=serializer.validated_data['user_name'],
                email=serializer.validated_data['email'],
                password=serializer.validated_data['password'],
                first_name=serializer.validated_data['first_name'],
                last_name=serializer.validated_data['last_name'],
                profile_image=serializer.validated_data['profile_image']
            )
            
            # Return a success response
            return Response({'message': 'User created successfully'}, status=status.HTTP_201_CREATED)
        else:
            # Debugging prints to inspect serializer error messages and errors
            print(serializer.error_messages)
            print(serializer._errors)
            
            # Return a response with serializer errors
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# API view for listing Books 
class BookList(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        books = Book.objects.all()
        serializer = BookSerializer(books, many=True)
        
        # Ajouter les infos supplémentaires du livre à partir de l'API Google Books
        for book in books:
            book_info = get_book_info_from_google(book.isbn)
            if book_info:
                # Mettez à jour le livre ou faites en sorte d'envoyer les données récupérées avec le serializer
                book_info['isbn'] = book.isbn  # Assurez-vous d'inclure l'ISBN pour chaque livre
                print(book_info)
        
        return Response(serializer.data, status=status.HTTP_200_OK)

    
# API view for searching books
class SearchBook(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.GET.get('query', '').strip()
        
        if query:
            # Si la recherche est par ISBN
            if len(query) == 13:  # ISBN standard de 13 caractères
                book_info = get_book_info_from_google(query)
                if book_info:
                    return Response(book_info, status=status.HTTP_200_OK)
                else:
                    return Response({'message': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # Recherche classique par titre, auteur, etc.
            books = Book.objects.filter(
                Q(author__icontains=query) |
                Q(title__icontains=query) |
                Q(isbn=query)
            )
            serializer = BookSerializer(books, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
    
    def sort_by_title(self, books):
        # Custom sorting algorithm for title (bubble sort)
        n = len(books)
        for i in range(n - 1):
            for j in range(0, n - i - 1):
                if books[j].title > books[j + 1].title:
                    books[j], books[j + 1] = books[j + 1], books[j]
        return books

    def sort_by_author(self, books):
        # Custom sorting algorithm for author (selection sort)
        n = len(books) 
        for i in range(n):
            min_idx = i
            for j in range(i + 1, n):
                if books[j].author < books[min_idx].author:
                    min_idx = j
            books[i], books[min_idx] = books[min_idx], books[i]
            
        return books

    def sort_by_isbn(self, books):
        # Custom sorting algorithm for isbn (insertion sort)
        n = len(books)
        for i in range(1, n):
            key = books[i]
            j = i - 1
            while j >= 0 and key.isbn < books[j].isbn:
                books[j + 1] = books[j]
                j -= 1
            books[j + 1] = key
        return books

class BorrowedBooksList(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        # get the user's object
        user = get_object_or_404(CustomUser, id=request.user.id)

        # Query for books borrowed by the usera
        borrowed_books = Borrow.objects.select_related('book').filter(user=user)

        # Serialize the borrowed book data using your serializer
        serializer = BorrowedBookSerializer(borrowed_books, many=True)

        return Response(serializer.data)

class ToggleFavoriteView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, book_id):
        try:
            book = Book.objects.get(pk=book_id)
            user = request.user

            # Check if the book is already a favorite for the user
            is_favorite = Favorite.objects.filter(user=user, book=book).exists()

            if is_favorite:
                # If already a favorite, remove it
                Favorite.objects.filter(user=user, book=book).delete()
                return Response({'message': 'Book removed from favorites'}, status=status.HTTP_200_OK)
            else:
                # If not a favorite, add it
                Favorite.objects.create(user=user, book=book)
                return Response({'message': 'Book added to favorites'}, status=status.HTTP_201_CREATED)

        except Book.DoesNotExist:
            return Response({'message': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)

 
class FavoritedBooksList(APIView):
    def get(self, request):
        # get the user's object
        user = get_object_or_404(CustomUser, id=request.user.id)

        # Query for books favorited by the usera
        favorited_books = Favorite.objects.select_related('book').filter(user=user)

        # Serialize the favorited book data using your serializer
        serializer = FavoritedBookSerializer(favorited_books, many=True)

        return Response(serializer.data)


class BorrowBookView(APIView):
    permission_classes = [IsAuthenticated]
    @transaction.atomic
    def post(self, request, book_id):
        try:
            book = Book.objects.get(pk=book_id)
            if book.quantity > 0:
                borrow = Borrow(
                    user=request.user,
                    book=book,
                    borrowed_date=datetime.date.today(),
                    quantity_borrowed=1,  # this Sets the quantity borrowed
                )
                borrow.save()

                # Decrement the book's quantity
                book.quantity -= borrow.quantity_borrowed
                book.save()

                return Response({'message': 'Book borrowed successfully.'}, status=status.HTTP_200_OK)
            else:
                return Response({'message': 'Book out of stock.'}, status=status.HTTP_400_BAD_REQUEST)
        except Book.DoesNotExist:
            return Response({'message': 'Book not found.'}, status=status.HTTP_404_NOT_FOUND)

class AddBookByISBN(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        isbn = request.data.get('isbn')
        
        # Vérifiez si le livre existe déjà
        book = Book.objects.filter(isbn=isbn).first()
        if not book:
            # Récupérer les informations via l'API Google Books
            book_info = get_book_info_from_google(isbn)
            if book_info:
                # Créer un livre avec l'ISBN seulement
                book = Book.objects.create(isbn=isbn)
                # Vous pouvez ajouter les informations supplémentaires ici si nécessaire
                # Par exemple, vous pouvez stocker ou simplement renvoyer les infos de Google Books
                return Response(book_info, status=status.HTTP_201_CREATED)
            else:
                return Response({'message': 'Book not found in Google Books API'}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({'message': 'Book already exists'}, status=status.HTTP_400_BAD_REQUEST)
