from rest_framework import serializers

from .models import BookModel, UserBook, BookView  # mavjud import qatoriga qo'shiladi


class BookModelSerializer(serializers.ModelSerializer):
    cover = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    is_locked = serializers.SerializerMethodField()
    is_free = serializers.ReadOnlyField()

    cover_file = serializers.ImageField(write_only=True, required=False, allow_null=True)
    cover_url = serializers.URLField(write_only=True, required=False, allow_null=True, allow_blank=True)
    file = serializers.FileField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = BookModel
        fields = ['id', 'title', 'author', 'description', 'genre', 'cover', 'cover_file', 'cover_url',
                  'file', 'file_url', 'price', 'is_free', 'is_locked', 'pages', 'is_active',
                  'download_count', 'created_at']

    def create(self, validated_data):
        cover_file = validated_data.pop('cover_file', None)
        cover_url = validated_data.pop('cover_url', None)
        file = validated_data.pop('file', None)

        book = BookModel.objects.create(**validated_data)

        if cover_file:
            book.cover_image = cover_file
        elif cover_url:
            book.cover_url = cover_url
        if file:
            book.file = file

        book.save()
        return book

    def update(self, instance, validated_data):
        cover_file = validated_data.pop('cover_file', None)
        cover_url = validated_data.pop('cover_url', None)
        file = validated_data.pop('file', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if cover_file:
            instance.cover_image = cover_file
        elif cover_url:
            instance.cover_url = cover_url
        if file:
            instance.file = file

        instance.save()
        return instance

    def get_cover(self, obj):
        request = self.context.get('request')
        return obj.get_cover_url(request)

    def get_is_locked(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None) if request else None
        return obj.is_locked_for(user)

    def get_file_url(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None) if request else None
        if obj.is_locked_for(user):
            return None
        return obj.get_file_url(request)


class UserBookSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='book.title', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = UserBook
        fields = ['id', 'user', 'user_name', 'book', 'book_title', 'granted_by', 'granted_at']

class BookViewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = BookView
        fields = ['id', 'user', 'user_name', 'device_id', 'viewed_at']

    def get_user_name(self, obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username
        return f"Mehmon ({obj.device_id[:12]}...)" if obj.device_id else "Mehmon"