from rest_framework import serializers
from .models import Category, Video, Task, TaskQuestion, UserCourse, StudentProgress, TaskSubmission

class CategorySerializer(serializers.ModelSerializer):
    video_count = serializers.ReadOnlyField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'icon', 'color', 'price', 
                  'video_count', 'created_at']


class TaskQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskQuestion
        fields = ['id', 'question', 'options', 'correct_answer', 'order']


class TaskSerializer(serializers.ModelSerializer):
    questions = TaskQuestionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Task
        fields = ['id', 'video', 'title', 'description', 'task_type', 'file', 
                  'allow_resubmission', 'requires_approval', 'questions', 'created_at']


class VideoSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    video_url = serializers.SerializerMethodField()
    thumbnail = serializers.SerializerMethodField()
    
    # Write-only fields - optional for file uploads
    video_file = serializers.FileField(write_only=True, required=False, allow_null=True)
    thumbnail_file = serializers.ImageField(write_only=True, required=False, allow_null=True)
    thumbnail_url = serializers.URLField(write_only=True, required=False, allow_null=True, allow_blank=True)
    
    class Meta:
        model = Video
        fields = ['id', 'category', 'category_name', 'title', 'description', 
                  'duration', 'thumbnail', 'video_url', 'video_file', 
                  'thumbnail_file', 'thumbnail_url',
                  'order', 'view_count', 'tasks', 'created_at']
        extra_kwargs = {
            'category': {'required': True},
            'title': {'required': True},
            'duration': {'required': False, 'allow_blank': True},
            'description': {'required': False, 'allow_blank': True},
        }
    
    def create(self, validated_data):
        # Handle file uploads
        video_file = validated_data.pop('video_file', None)
        thumbnail_file = validated_data.pop('thumbnail_file', None)
        thumbnail_url = validated_data.pop('thumbnail_url', None)
        
        # Set default empty description if not provided
        if 'description' not in validated_data or validated_data.get('description') is None:
            validated_data['description'] = ''
        
        video = Video.objects.create(**validated_data)
        
        if video_file:
            video.video_file = video_file
        if thumbnail_file:
            video.thumbnail = thumbnail_file
        elif thumbnail_url:
            video.thumbnail_url = thumbnail_url
            
        video.save()
        return video
    
    def update(self, instance, validated_data):
        video_file = validated_data.pop('video_file', None)
        thumbnail_file = validated_data.pop('thumbnail_file', None)
        thumbnail_url = validated_data.pop('thumbnail_url', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if video_file:
            instance.video_file = video_file
        if thumbnail_file:
            instance.thumbnail = thumbnail_file
        elif thumbnail_url:
            instance.thumbnail_url = thumbnail_url
            
        instance.save()
        return instance
    
    def get_video_url(self, obj):
        """Return video file URL or external URL"""
        if obj.video_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.video_file.url)
            return obj.video_file.url
        return obj.video_url
    
    def get_thumbnail(self, obj):
        """Return thumbnail file URL or external URL"""
        if obj.thumbnail:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.thumbnail.url)
            return obj.thumbnail.url
        return obj.thumbnail_url


class UserCourseSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = UserCourse
        fields = ['id', 'user', 'user_name', 'category', 'category_name', 
                  'granted_by', 'granted_at', 'expires_at']


class StudentProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProgress
        fields = ['id', 'user', 'completed_videos', 'completed_tasks']


class TaskSubmissionSerializer(serializers.ModelSerializer):
    task_title = serializers.CharField(source='task.title', read_only=True)
    task_type = serializers.CharField(source='task.task_type', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_full_name = serializers.SerializerMethodField()
    video_title = serializers.CharField(source='task.video.title', read_only=True)
    
    class Meta:
        model = TaskSubmission
        fields = ['id', 'user', 'user_name', 'user_full_name', 'task', 'task_title', 'task_type',
                  'video_title', 'file', 'text_content', 'answers', 'score', 'total', 
                  'status', 'feedback', 'reviewed_at', 'submitted_at']
    
    def get_user_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username
