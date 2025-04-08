from rest_framework import serializers
from library_app.models import CustomUser
from library_app.models import Book, Borrow,Favorite

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = "__all__"
        

class BookSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source='book_info.title')
    author = serializers.ListField(source='book_info.author')
    cover_image = serializers.URLField(source='book_info.cover_image')
    
    class Meta:
        model = Book
        fields = ['isbn', 'title', 'author', 'cover_image']


class BorrowedBookSerializer(serializers.ModelSerializer):
    book = serializers.SerializerMethodField()

    class Meta:
        model = Borrow
        fields = ('book',)

    def get_book(self, obj):
        book = obj.book
        return {
            'id' : book.id,
            'title': book.title,
            'author': book.author,
            'quantity': book.quantity,
            'cover_image': book.cover_image.url,
            'isbn': book.isbn, 
            'inserted_date': book.inserted_date,
        }


class FavoritedBookSerializer(serializers.ModelSerializer):
    book = serializers.SerializerMethodField()

    class Meta:
        model = Favorite
        fields = ('book',)

    def get_book(self, obj):
        book = obj.book
        return {
            'id' : book.id,
            'title': book.title,
            'author': book.author,
            'quantity': book.quantity,
            'cover_image': book.cover_image.url,
            'isbn': book.isbn, 
            'inserted_date': book.inserted_date,
        }