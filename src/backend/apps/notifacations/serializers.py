from rest_framework import serializers
from .models import Notification, UserNotification
from apps.users.serializers import UserSerializer


class NotificationRecipientSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()


class NotificationSerializer(serializers.ModelSerializer):
    recipients_count = serializers.SerializerMethodField()
    recipients_detail = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'type', 'recipients', 
                  'recipients_count', 'recipients_detail', 'sent_count', 'status', 'scheduled_at', 'created_at']
    
    def get_recipients_count(self, obj):
        return obj.recipients.count()
    
    def get_recipients_detail(self, obj):
        return list(obj.recipients.values('id', 'username', 'first_name', 'last_name'))


class UserNotificationSerializer(serializers.ModelSerializer):
    notification = NotificationSerializer(read_only=True)
    
    class Meta:
        model = UserNotification
        fields = ['id', 'notification', 'is_read', 'received_at']


class SendNotificationSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    message = serializers.CharField()
    type = serializers.ChoiceField(choices=['system', 'course', 'payment', 'info', 'warning', 'success', 'error'])
    user_ids = serializers.ListField(child=serializers.CharField(), required=False)
    send_to_all = serializers.BooleanField(default=False)
    send_now = serializers.BooleanField(default=True)
    scheduled_at = serializers.DateTimeField(required=False, allow_null=True)

