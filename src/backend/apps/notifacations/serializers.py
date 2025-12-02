from rest_framework import serializers
from .models import Notification, UserNotification

class NotificationSerializer(serializers.ModelSerializer):
    recipients_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'type', 'recipients', 
                  'recipients_count', 'sent_count', 'created_at']
    
    def get_recipients_count(self, obj):
        return obj.recipients.count()


class UserNotificationSerializer(serializers.ModelSerializer):
    notification = NotificationSerializer(read_only=True)
    
    class Meta:
        model = UserNotification
        fields = ['id', 'notification', 'is_read', 'received_at']


class SendNotificationSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    message = serializers.CharField()
    type = serializers.ChoiceField(choices=['info', 'warning', 'success', 'error'])
    user_ids = serializers.ListField(child=serializers.IntegerField(), required=False)
    send_to_all = serializers.BooleanField(default=False)
