from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Payment
from .serializers import PaymentSerializer, PaymentCreateSerializer
from apps.notifacations.models import Notification, UserNotification
from apps.courses.models import UserCourse


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return PaymentCreateSerializer
        return PaymentSerializer

    def get_queryset(self):
        queryset = Payment.objects.all()
        user_id = self.request.query_params.get('user', None)
        status_filter = self.request.query_params.get('status', None)
        
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset

    @action(detail=False, methods=['get'])
    def my_payments(self, request):
        """Get current user's payments"""
        payments = Payment.objects.filter(user=request.user)
        serializer = self.get_serializer(payments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update payment status"""
        payment = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in ['pending', 'active', 'expired', 'cancelled']:
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        payment.status = new_status
        payment.save()
        
        # Grant course access when payment is active
        if new_status == 'active' and payment.category:
            UserCourse.objects.get_or_create(
                user=payment.user,
                category=payment.category,
                defaults={'granted_by': 'payment'}
            )
        
        # Send notification to user when payment is saved/updated
        if payment.user:
            notification = Notification.objects.create(
                title="To'lov saqlandi",
                message=f"Sizning to'lovingiz ({payment.amount} so'm) muvaffaqiyatli saqlandi. Holat: {new_status}",
                type='payment'
            )
            UserNotification.objects.create(
                user=payment.user,
                notification=notification
            )
        
        serializer = self.get_serializer(payment)
        return Response(serializer.data)
    
    def perform_create(self, serializer):
        """Send notification when new payment is created and grant course access"""
        payment = serializer.save()
        
        # Grant course access when payment is active
        if payment.status == 'active' and payment.category:
            UserCourse.objects.get_or_create(
                user=payment.user,
                category=payment.category,
                defaults={'granted_by': 'payment'}
            )
        
        if payment.user:
            notification = Notification.objects.create(
                title="Yangi to'lov",
                message=f"Sizning to'lovingiz ({payment.amount} so'm) qabul qilindi.",
                type='payment'
            )
            UserNotification.objects.create(
                user=payment.user,
                notification=notification
            )
