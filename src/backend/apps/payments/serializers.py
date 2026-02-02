from rest_framework import serializers
from .models import Payment
from ..users.serializers import UserSerializer


class PaymentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    user = UserSerializer(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True, allow_null=True)

    class Meta:
        model = Payment
        fields = ['id', 'user', 'user_name', 'category', 'category_name', 'amount', 'description',
                  'status', 'expires_at', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class PaymentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['user', 'category', 'amount', 'description', 'status', 'expires_at']
