from django.db import models
from apps.users.models import User


class Category(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    icon = models.CharField(max_length=10)
    color = models.CharField(max_length=50, null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    @property
    def video_count(self):
        return self.videos.count()

    class Meta:
        db_table = 'categories'
        ordering = ['created_at']
        verbose_name_plural = 'Categories'


class Video(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='videos')
    title = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    duration = models.CharField(max_length=10)
    thumbnail = models.ImageField(upload_to='thumbnails/', null=True, blank=True)
    thumbnail_url = models.URLField(null=True, blank=True)
    video_file = models.FileField(upload_to='videos/', null=True, blank=True)
    video_url = models.URLField(null=True, blank=True)
    order = models.IntegerField(default=0)
    view_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
    
    def get_video_url(self):
        """Return video file URL or external URL"""
        if self.video_file:
            return self.video_file.url
        return self.video_url
    
    def get_thumbnail_url(self):
        """Return thumbnail file URL or external URL"""
        if self.thumbnail:
            return self.thumbnail.url
        return self.thumbnail_url

    class Meta:
        db_table = 'videos'
        ordering = ['category', 'order']


class Task(models.Model):
    TASK_TYPE_CHOICES = (
        ('test', 'Test'),
        ('file', 'File Upload'),
        ('text', 'Text'),
    )
    
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    task_type = models.CharField(max_length=10, choices=TASK_TYPE_CHOICES, default='test')
    file = models.FileField(upload_to='tasks/', blank=True, null=True)
    allow_resubmission = models.BooleanField(default=True)
    requires_approval = models.BooleanField(default=False)  # For file/text tasks
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    class Meta:
        db_table = 'tasks'
        ordering = ['created_at']


class TaskQuestion(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='questions')
    question = models.TextField()
    options = models.JSONField()  # List of options
    correct_answer = models.IntegerField()
    order = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.task.title} - Question {self.order}"

    class Meta:
        db_table = 'task_questions'
        ordering = ['order']


class UserCourse(models.Model):
    GRANTED_BY_CHOICES = (
        ('payment', 'Payment'),
        ('gift', 'Gift'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_courses')
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    granted_by = models.CharField(max_length=10, choices=GRANTED_BY_CHOICES)
    granted_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} - {self.category.name}"

    class Meta:
        db_table = 'user_courses'
        unique_together = ['user', 'category']
        ordering = ['-granted_at']


class StudentProgress(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='progress')
    completed_videos = models.JSONField(default=list)  # List of video IDs
    completed_tasks = models.JSONField(default=list)  # List of task IDs

    def __str__(self):
        return f"{self.user.username} - Progress"

    class Meta:
        db_table = 'student_progress'


class TaskSubmission(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='task_submissions')
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='submissions')
    file = models.FileField(upload_to='submissions/', blank=True, null=True)
    text_content = models.TextField(blank=True, null=True)  # For text submissions
    answers = models.JSONField(default=dict, blank=True)  # For test submissions: {question_id: selected_answer}
    score = models.IntegerField(default=0)
    total = models.IntegerField(default=0)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    feedback = models.TextField(blank=True, null=True)  # Teacher feedback
    reviewed_at = models.DateTimeField(blank=True, null=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.task.title}"

    class Meta:
        db_table = 'task_submissions'
        ordering = ['-submitted_at']
