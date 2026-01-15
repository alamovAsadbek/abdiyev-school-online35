import logging

from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from .models import User
from .serializers import (
    UserSerializer, UserRegisterSerializer, 
    UserDetailSerializer, ChangePasswordSerializer
)

logger = logging.getLogger(__name__)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return UserDetailSerializer
        return UserSerializer
    
    def get_permissions(self):
        if self.action in ['register', 'login']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    @swagger_auto_schema(
        operation_description="Register a new user",
        request_body=UserRegisterSerializer,
        responses={
            201: openapi.Response('User registered successfully', UserSerializer),
            400: 'Bad Request'
        }
    )
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register(self, request):
        logger.info(f"Registration attempt for username: {request.data.get('username')}")
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            logger.info(f"User registered successfully: {user.username}")
            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_201_CREATED)
        logger.warning(f"Registration failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @swagger_auto_schema(
        operation_description="Login with username and password",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['username', 'password'],
            properties={
                'username': openapi.Schema(type=openapi.TYPE_STRING),
                'password': openapi.Schema(type=openapi.TYPE_STRING),
            }
        ),
        responses={
            200: openapi.Response('Login successful'),
            401: 'Invalid credentials',
            403: 'Account blocked'
        }
    )
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        logger.info(f"Login attempt for username: {username}")

        user = authenticate(username=username, password=password)

        if user is not None:
            if user.is_blocked:
                logger.warning(f"Blocked user tried to login: {username}")
                return Response({'error': 'Your account has been blocked'}, status=status.HTTP_403_FORBIDDEN)

            # ✅ LAST_LOGIN update
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])

            refresh = RefreshToken.for_user(user)
            logger.info(f"User logged in successfully: {username}")
            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })

        logger.warning(f"Failed login attempt for username: {username}")
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    @swagger_auto_schema(
        operation_description="Get current user profile",
        responses={200: UserDetailSerializer}
    )
    @action(detail=False, methods=['get'])
    def me(self, request):
        logger.info(f"User profile requested: {request.user.username}")
        serializer = UserDetailSerializer(request.user)
        return Response(serializer.data)
    
    @swagger_auto_schema(
        operation_description="Change user password",
        request_body=ChangePasswordSerializer,
        responses={200: 'Password changed successfully', 400: 'Bad Request'}
    )
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.data.get('old_password')):
                logger.warning(f"Wrong password attempt for user: {user.username}")
                return Response(
                    {'error': 'Wrong password'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.set_password(serializer.data.get('new_password'))
            user.save()
            logger.info(f"Password changed for user: {user.username}")
            return Response({'message': 'Password changed successfully'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @swagger_auto_schema(
        operation_description="Block a user",
        responses={200: 'User blocked successfully'}
    )
    @action(detail=True, methods=['post'])
    def block(self, request, pk=None):
        user = self.get_object()
        user.is_blocked = True
        user.save()
        logger.info(f"User blocked: {user.username} by {request.user.username}")
        return Response({'message': 'User blocked successfully'})
    
    @swagger_auto_schema(
        operation_description="Unblock a user",
        responses={200: 'User unblocked successfully'}
    )
    @action(detail=True, methods=['post'])
    def unblock(self, request, pk=None):
        user = self.get_object()
        user.is_blocked = False
        user.save()
        logger.info(f"User unblocked: {user.username} by {request.user.username}")
        return Response({'message': 'User unblocked successfully'})
    
    @swagger_auto_schema(
        operation_description="Reset user password (admin only)",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['new_password'],
            properties={
                'new_password': openapi.Schema(type=openapi.TYPE_STRING),
            }
        ),
        responses={200: 'Password reset successfully'}
    )
    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        user = self.get_object()
        new_password = request.data.get('new_password')
        if not new_password:
            return Response({'error': 'New password required'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(new_password)
        user.save()
        logger.info(f"Password reset for user: {user.username} by {request.user.username}")
        return Response({'message': 'Password reset successfully'})
