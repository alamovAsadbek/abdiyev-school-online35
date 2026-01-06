from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone', 'role', 'avatar', 'watermark_id',
                  'is_blocked', 'created_at', 'first_name', 'last_name']
        read_only_fields = ['id', 'created_at', 'role']


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    first_name = serializers.CharField(required=True, max_length=100)
    last_name = serializers.CharField(required=True, max_length=100)

    class Meta:
        model = User
        fields = ['username', 'password', 'password2', 'email', 'phone', 'first_name', 'last_name']
        extra_kwargs = {
            'email': {'required': False},
            'phone': {'required': False},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user


class UserDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone', 'role', 'avatar', 
                  'is_blocked', 'created_at', 'first_name', 'last_name', 'watermark_id',
                  'date_joined', 'last_login']
        read_only_fields = ['id', 'created_at', 'date_joined', 'last_login', 'role']


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
