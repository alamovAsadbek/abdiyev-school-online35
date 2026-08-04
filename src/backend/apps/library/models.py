from django.db import models

from apps.users.models import User

class BookModel(models.Model):
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    genre = models.CharField(max_length=100, blank=True, null=True)
    cover_image = models.ImageField(upload_to='book_covers/', null=True, blank=True)
    cover_url = models.URLField(null=True, blank=True)
    file = models.FileField(upload_to='books/', null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    pages = models.IntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    download_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    @property
    def is_free(self):
        return self.price == 0

    def get_cover_url(self, request=None):
        if self.cover_image:
            if request:
                return request.build_absolute_uri(self.cover_image.url)
            return self.cover_image.url
        return self.cover_url

    def get_file_url(self, request=None):
        if not self.file:
            return None
        if request:
            return request.build_absolute_uri(self.file.url)
        return self.file.url

    def is_locked_for(self, user):
        if self.is_free:
            return False
        if not user or not getattr(user, 'is_authenticated', False):
            return True
        if user.is_staff or user.is_superuser:
            return False
        return not UserBook.objects.filter(user=user, book=self).exists()

    class Meta:
        db_table = 'books'
        ordering = ['-created_at']


class UserBook(models.Model):
    GRANTED_BY_CHOICES = (
        ('payment', 'Payment'),
        ('gift', 'Gift'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_books')
    book = models.ForeignKey(BookModel, on_delete=models.CASCADE, related_name='user_books')
    granted_by = models.CharField(max_length=10, choices=GRANTED_BY_CHOICES, default='payment')
    granted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.book.title}"

    class Meta:
        db_table = 'user_books'
        unique_together = ['user', 'book']

class BookView(models.Model):
    book = models.ForeignKey(BookModel, on_delete=models.CASCADE, related_name='views_log')
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='book_views')
    device_id = models.CharField(max_length=64, null=True, blank=True)
    viewed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        owner = self.user.username if self.user else self.device_id
        return f"{owner} - {self.book.title}"

    class Meta:
        db_table = 'book_views'
        ordering = ['-viewed_at']