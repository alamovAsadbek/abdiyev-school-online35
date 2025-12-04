from django.contrib import admin
from .models import Notification, UserNotification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'type', 'sent_count', 'created_at']
    list_filter = ['type', 'created_at']
    search_fields = ['title', 'message']
    filter_horizontal = ['recipients']


@admin.register(UserNotification)
class UserNotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'notification', 'is_read', 'received_at']
    list_filter = ['is_read', 'received_at']
    search_fields = ['user__username', 'notification__title']
