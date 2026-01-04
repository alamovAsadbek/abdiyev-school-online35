from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from .models import Notification, UserNotification
from .serializers import NotificationSerializer, UserNotificationSerializer, SendNotificationSerializer
from apps.users.models import User


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Student faqat o'ziga tegishli (recipient) notificationlarni ko'ra oladi
        qs = super().get_queryset()
        user = getattr(self.request, 'user', None)
        if not user or not getattr(user, 'is_authenticated', False):
            return qs.none()
        if getattr(user, 'role', None) == 'admin':
            return qs
        return qs.filter(recipients=user)

    @swagger_auto_schema(
        operation_description="Send notification to users",
        request_body=SendNotificationSerializer,
        responses={201: NotificationSerializer}
    )
    @action(detail=False, methods=['post'])
    def send_notification(self, request):
        if getattr(request.user, 'role', None) != 'admin':
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

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

    @swagger_auto_schema(
        operation_description="Get notification statistics",
        responses={200: openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'total_notifications': openapi.Schema(type=openapi.TYPE_INTEGER),
                'total_sent': openapi.Schema(type=openapi.TYPE_INTEGER),
            }
        )}
    )
    @action(detail=False, methods=['get'])
    def stats(self, request):
        if getattr(request.user, 'role', None) != 'admin':
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        total = Notification.objects.count()
        total_sent = sum(Notification.objects.values_list('sent_count', flat=True))
        return Response({
            'total_notifications': total,
            'total_sent': total_sent
        })


class UserNotificationViewSet(viewsets.ModelViewSet):
    queryset = UserNotification.objects.all()
    serializer_class = UserNotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user = getattr(self.request, 'user', None)
        if not user or not getattr(user, 'is_authenticated', False):
            return qs.none()

        # Admin: hammasini ko'rishi mumkin (ixtiyoriy user_id filtri bilan)
        if getattr(user, 'role', None) == 'admin':
            user_id = self.request.query_params.get('user_id')
            if user_id:
                return qs.filter(user_id=user_id)
            return qs

        # Student: faqat o'ziga tegishlilar
        return qs.filter(user=user)

    @swagger_auto_schema(
        operation_description="Get current user's notifications",
        responses={200: UserNotificationSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def my_notifications(self, request):
        notifications = UserNotification.objects.filter(user=request.user)
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)

    @swagger_auto_schema(
        operation_description="Get unread notifications count",
        responses={200: openapi.Schema(type=openapi.TYPE_OBJECT, properties={'count': openapi.Schema(type=openapi.TYPE_INTEGER)})}
    )
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = UserNotification.objects.filter(user=request.user, is_read=False).count()
        return Response({'count': count})

    @swagger_auto_schema(
        operation_description="Mark notification as read",
        responses={200: openapi.Schema(type=openapi.TYPE_OBJECT, properties={'message': openapi.Schema(type=openapi.TYPE_STRING)})}
    )
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'message': 'Marked as read'})

    @swagger_auto_schema(
        operation_description="Mark all notifications as read",
        responses={200: openapi.Schema(type=openapi.TYPE_OBJECT, properties={'message': openapi.Schema(type=openapi.TYPE_STRING)})}
    )
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        UserNotification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'message': 'All notifications marked as read'})

