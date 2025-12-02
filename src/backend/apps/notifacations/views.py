from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Notification, UserNotification
from .serializers import NotificationSerializer, UserNotificationSerializer, SendNotificationSerializer
from apps.users.models import User

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def send_notification(self, request):
        serializer = SendNotificationSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            
            notification = Notification.objects.create(
                title=data['title'],
                message=data['message'],
                type=data['type']
            )
            
            if data.get('send_to_all'):
                users = User.objects.filter(role='student', is_blocked=False)
            else:
                user_ids = data.get('user_ids', [])
                users = User.objects.filter(id__in=user_ids, is_blocked=False)
            
            notification.recipients.set(users)
            
            # Create UserNotification for each recipient
            for user in users:
                UserNotification.objects.create(
                    user=user,
                    notification=notification
                )
            
            notification.sent_count = users.count()
            notification.save()
            
            return Response(
                NotificationSerializer(notification).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserNotificationViewSet(viewsets.ModelViewSet):
    queryset = UserNotification.objects.all()
    serializer_class = UserNotificationSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def my_notifications(self, request):
        notifications = UserNotification.objects.filter(user=request.user)
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'message': 'Marked as read'})
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        UserNotification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'message': 'All notifications marked as read'})
