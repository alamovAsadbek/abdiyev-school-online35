from rest_framework import serializers
from .models import Category, Module, Video, Task, TaskQuestion, UserCourse, StudentProgress, TaskSubmission


class ModuleSerializer(serializers.ModelSerializer):
    video_count = serializers.ReadOnlyField()

    class Meta:
        model = Module
        fields = ['id', 'category', 'name', 'description', 'order', 'price', 'video_count', 'created_at']


class CategorySerializer(serializers.ModelSerializer):
    video_count = serializers.ReadOnlyField()
    module_count = serializers.ReadOnlyField()
    modules = ModuleSerializer(many=True, read_only=True)
    is_free = serializers.ReadOnlyField()  # <-- YANGI QATOR

    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'icon', 'color', 'price',
                  'is_modular', 'requires_sequential', 'is_active', 'is_free',  # <-- 'is_free' qo'shildi
                  'video_count', 'module_count', 'modules', 'created_at']


# class OnlyVideoSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Video
#         fields = ['id', 'category', 'title', 'description',
#                   'duration', 'thumbnail', 'video_file',
#                   'thumbnail_url',
#                   'order', 'view_count', 'created_at']


class TaskQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskQuestion
        fields = ['id', 'question', 'description', 'image', 'options', 'correct_answer', 'order']


class TaskSerializer(serializers.ModelSerializer):
    questions = TaskQuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Task
        fields = ['id', 'video', 'title', 'description', 'task_type', 'file', 'answer_file',
                  'allow_resubmission', 'requires_approval', 'questions', 'created_at']


class VideoSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    module_name = serializers.CharField(source='module.name', read_only=True, allow_null=True)
    video_url = serializers.SerializerMethodField()
    thumbnail = serializers.SerializerMethodField()
    is_locked = serializers.SerializerMethodField()
    lesson_file_url = serializers.SerializerMethodField()          # <-- YANGI

    video_file = serializers.FileField(write_only=True, required=False, allow_null=True)
    thumbnail_file = serializers.ImageField(write_only=True, required=False, allow_null=True)
    thumbnail_url = serializers.URLField(write_only=True, required=False, allow_null=True, allow_blank=True)
    lesson_file = serializers.FileField(write_only=True, required=False, allow_null=True)   # <-- YANGI (yuklash uchun)

    class Meta:
        model = Video
        fields = ['id', 'category', 'category_name', 'module', 'module_name', 'title', 'description',
                  'duration', 'thumbnail', 'video_url', 'video_file', 'is_locked',
                  'thumbnail_file', 'thumbnail_url',
                  'lesson_file', 'lesson_file_url',                # <-- YANGI
                  'order', 'view_count', 'tasks', 'created_at']
        extra_kwargs = {
            'category': {'required': True},
            'title': {'required': True},
            'duration': {'required': False, 'allow_blank': True},
            'description': {'required': False, 'allow_blank': True},
            'module': {'required': False, 'allow_null': True},
        }

    def create(self, validated_data):
        video_file = validated_data.pop('video_file', None)
        thumbnail_file = validated_data.pop('thumbnail_file', None)
        thumbnail_url = validated_data.pop('thumbnail_url', None)
        lesson_file = validated_data.pop('lesson_file', None)      # <-- YANGI

        if 'description' not in validated_data or validated_data.get('description') is None:
            validated_data['description'] = ''

        video = Video.objects.create(**validated_data)

        if video_file:
            video.video_file = video_file
        if thumbnail_file:
            video.thumbnail = thumbnail_file
        elif thumbnail_url:
            video.thumbnail_url = thumbnail_url
        if lesson_file:                                            # <-- YANGI
            video.lesson_file = lesson_file

        video.save()
        return video

    def update(self, instance, validated_data):
        video_file = validated_data.pop('video_file', None)
        thumbnail_file = validated_data.pop('thumbnail_file', None)
        thumbnail_url = validated_data.pop('thumbnail_url', None)
        lesson_file = validated_data.pop('lesson_file', None)      # <-- YANGI

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if video_file:
            instance.video_file = video_file
        if thumbnail_file:
            instance.thumbnail = thumbnail_file
        elif thumbnail_url:
            instance.thumbnail_url = thumbnail_url
        if lesson_file:                                            # <-- YANGI
            instance.lesson_file = lesson_file

        instance.save()
        return instance

    def get_video_url(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None) if request else None

        if obj.is_locked_for(user):
            return None

        if obj.video_file:
            if request:
                return request.build_absolute_uri(obj.video_file.url)
            return obj.video_file.url
        return obj.video_url

    def get_thumbnail(self, obj):
        if obj.thumbnail:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.thumbnail.url)
            return obj.thumbnail.url
        return obj.thumbnail_url

    def get_is_locked(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None) if request else None
        return obj.is_locked_for(user)

    def get_lesson_file_url(self, obj):                            # <-- YANGI
        """Qulflangan video uchun qo'llanma faylini ham berma"""
        request = self.context.get('request')
        user = getattr(request, 'user', None) if request else None

        if obj.is_locked_for(user):
            return None

        return obj.get_lesson_file_url(request)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if data.get('is_locked'):
            data['tasks'] = []
        return data


class UserCourseSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_is_modular = serializers.BooleanField(source='category.is_modular', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    module_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Module.objects.all(), source='modules', required=False
    )
    modules_detail = ModuleSerializer(source='modules', many=True, read_only=True)

    class Meta:
        model = UserCourse
        fields = ['id', 'user', 'user_name', 'category', 'category_name', 'category_is_modular',
                  'module_ids', 'modules_detail', 'granted_by', 'granted_at', 'expires_at']


class StudentProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProgress
        fields = ['id', 'user', 'completed_videos', 'completed_tasks']


class TaskSubmissionSerializer(serializers.ModelSerializer):
    task_title = serializers.CharField(source='task.title', read_only=True)
    task_type = serializers.CharField(source='task.task_type', read_only=True)
    user_name = serializers.SerializerMethodField()
    user_full_name = serializers.SerializerMethodField()
    video_title = serializers.CharField(source='task.video.title', read_only=True)
    video = serializers.CharField(source='task.video.id', read_only=True)

    class Meta:
        model = TaskSubmission
        fields = ['id', 'user', 'user_name', 'user_full_name', 'device_id', 'task', 'task_title', 'task_type',
                  'video_title', 'file', 'text_content', 'answers', 'score', 'total',
                  'status', 'feedback', 'reviewed_at', 'submitted_at', 'video']

    def get_user_name(self, obj):
        if obj.user:
            return obj.user.username
        return f"Mehmon ({obj.device_id[:12]}...)" if obj.device_id else "Mehmon"

    def get_user_full_name(self, obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username
        return f"Mehmon ({obj.device_id[:12]}...)" if obj.device_id else "Mehmon"
