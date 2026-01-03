from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('student', 'Student'),
    )
    
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    is_blocked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    # Unique watermark ID - auto-generated, cannot be changed
    watermark_id = models.CharField(max_length=8, unique=True, editable=False, null=True, blank=True)
    
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []
    
    def save(self, *args, **kwargs):
        if not self.watermark_id:
            # Generate unique 8-character watermark ID
            self.watermark_id = uuid.uuid4().hex[:8].upper()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.username
    
    class Meta:
        db_table = 'users'
        ordering = ['-created_at']
