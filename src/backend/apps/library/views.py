from django.db.models import Q   # fayl boshida, agar hali yo'q bo'lsa
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from .models import BookModel, UserBook, BookView  # mavjud import qatoriga qo'shiladi
from .serializers import BookModelSerializer, UserBookSerializer, \
    BookViewSerializer  # mavjud import qatoriga qo'shiladi


class BookModelViewSet(viewsets.ModelViewSet):
    queryset = BookModel.objects.all()
    serializer_class = BookModelSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'genres', 'increment_download', 'record_view']:
            return [AllowAny()]
        return [IsAdminUser()]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        queryset = BookModel.objects.all()
        genre = self.request.query_params.get('genre')
        is_free = self.request.query_params.get('is_free')
        search = self.request.query_params.get('search')
        is_active = self.request.query_params.get('is_active')

        user = self.request.user
        is_admin = user.is_authenticated and (user.is_staff or user.is_superuser)

        if not is_admin:
            queryset = queryset.filter(is_active=True)
        elif is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        if genre:
            queryset = queryset.filter(genre__iexact=genre)
        if is_free is not None:
            if is_free.lower() == 'true':
                queryset = queryset.filter(price=0)
            else:
                queryset = queryset.filter(price__gt=0)
        if search:
            queryset = queryset.filter(Q(title__icontains=search) | Q(author__icontains=search))

        return queryset

    @action(detail=False, methods=['get'])
    def genres(self, request):
        genres = BookModel.objects.filter(is_active=True).exclude(genre__isnull=True).exclude(
            genre__exact='').values_list('genre', flat=True).distinct()
        return Response(list(genres))

    @action(detail=True, methods=['post'])
    def increment_download(self, request, pk=None):
        book = self.get_object()
        book.download_count += 1
        book.save(update_fields=['download_count'])
        return Response({'download_count': book.download_count})

    @action(detail=True, methods=['post'])
    def record_view(self, request, pk=None):
        """Kim ko'rganini yozib boradi - login bo'lsa user, bo'lmasa device_id orqali"""
        book = self.get_object()
        user = request.user if request.user.is_authenticated else None
        device_id = request.data.get('device_id')

        BookView.objects.create(book=book, user=user, device_id=device_id if not user else None)
        return Response({'status': 'ok'})

    @action(detail=True, methods=['get'])
    def viewers(self, request, pk=None):
        """Admin uchun - kimlar ko'rgani ro'yxati"""
        book = self.get_object()
        views = BookView.objects.filter(book=book).select_related('user')[:200]
        serializer = BookViewSerializer(views, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def gifted_users(self, request, pk=None):
        """Admin uchun - kimlarga sovg'a/sotib olingan ro'yxati"""
        book = self.get_object()
        user_books = UserBook.objects.filter(book=book).select_related('user')
        serializer = UserBookSerializer(user_books, many=True)
        return Response(serializer.data)


class UserBookViewSet(viewsets.ModelViewSet):
    queryset = UserBook.objects.all()
    serializer_class = UserBookSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser:
            query_user = self.request.query_params.get('user')
            if query_user:
                return UserBook.objects.filter(user_id=query_user)
            return UserBook.objects.all()
        return UserBook.objects.filter(user=user)

    @action(detail=False, methods=['get'])
    def my_books(self, request):
        books = UserBook.objects.filter(user=request.user)
        serializer = self.get_serializer(books, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def grant_book(self, request):
        """Bir nechta userga birdan kitob berish"""
        user_ids = request.data.get('user_ids', [])
        book_id = request.data.get('book_id')
        granted_by = request.data.get('granted_by', 'gift')

        if not user_ids or not book_id:
            return Response({'error': 'user_ids va book_id kerak'}, status=status.HTTP_400_BAD_REQUEST)

        created_list = []
        for user_id in user_ids:
            user_book, created = UserBook.objects.get_or_create(
                user_id=user_id, book_id=book_id, defaults={'granted_by': granted_by}
            )
            created_list.append(user_book)

        serializer = self.get_serializer(created_list, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def revoke(self, request, pk=None):
        """Foydalanuvchidan kitob huquqini qaytarib olish"""
        user_book = self.get_object()
        user_book.delete()
        return Response({'status': 'revoked'}, status=status.HTTP_200_OK)