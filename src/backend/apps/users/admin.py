from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['id', 'username', 'email', 'role', 'is_blocked', 'created_at']
    list_filter = ['role', 'is_blocked', 'is_active', 'created_at']
    search_fields = ['username', 'email', 'phone']
    ordering = ['-created_at']
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email', 'phone', 'avatar')}),
        ('Permissions', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'is_blocked')}),
        ('Important dates', {'fields': ('last_login', 'date_joined', 'created_at')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'password1', 'password2', 'role'),
        }),
    )
    
    readonly_fields = ['created_at', 'date_joined', 'last_login']
