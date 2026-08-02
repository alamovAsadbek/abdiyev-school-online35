from django.db import models
from apps.users.models import User


class Category(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    icon = models.CharField(max_length=10)
    color = models.CharField(max_length=50, null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_modular = models.BooleanField(default=False)  # Whether course has modules
    requires_sequential = models.BooleanField(default=True)  # Whether sequential access is required
    is_active = models.BooleanField(default=True)  # Whether course is active/visible
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def is_free(self):
        return self.price == 0

    def __str__(self):
        return self.name

    @property
    def video_count(self):
        return self.videos.count()

    @property
    def module_count(self):
        return self.modules.count() if self.is_modular else 0

    class Meta:
        db_table = 'categories'
        ordering = ['created_at']
        verbose_name_plural = 'Categories'


class Module(models.Model):
    """Module within a course (only for modular courses)"""
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='modules')
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    order = models.IntegerField(default=0)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)  # Optional separate price
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.category.name} - {self.name}"

    @property
    def video_count(self):
        return self.videos.count()

    class Meta:
        db_table = 'modules'
        ordering = ['category', 'order']


class Video(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='videos')
    module = models.ForeignKey(Module, on_delete=models.SET_NULL, null=True, blank=True, related_name='videos')
    title = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    duration = models.CharField(max_length=10)
    thumbnail = models.ImageField(upload_to='thumbnails/', null=True, blank=True)
    thumbnail_url = models.URLField(null=True, blank=True)
    video_file = models.FileField(upload_to='videos/', null=True, blank=True)
    lesson_file = models.FileField(upload_to='lessons/', null=True, blank=True)
    video_url = models.URLField(null=True, blank=True)
    order = models.IntegerField(default=0)
    view_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    def get_lesson_file_url(self, request=None):
        """Qo'llanma faylining URL manzilini qaytaradi"""
        if not self.lesson_file:
            return None
        if request:
            return request.build_absolute_uri(self.lesson_file.url)
        return self.lesson_file.url

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

    def get_category_name(self):
        return self.category.name

    def get_module_name(self):
        return self.module.name if self.module else None

    class Meta:
        db_table = 'videos'
        ordering = ['category', 'module', 'order']

    def is_locked_for(self, user):
        """Shu video berilgan user uchun qulflanganmi yoki yo'q"""
        category = self.category

        # Bepul kurs — hech kimga qulf yo'q
        if category.price == 0:
            return False

        # Login qilmagan user — qulflangan
        if not user or not getattr(user, 'is_authenticated', False):
            return True

        # Admin — qulf yo'q
        if user.is_staff or user.is_superuser:
            return False

        # Kursni sotib olganmi / berilganmi tekshiramiz
        user_course = UserCourse.objects.filter(user=user, category=category).first()
        if not user_course:
            return True

        return not user_course.has_access_to_video(self)


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
    answer_file = models.FileField(upload_to='task_answers/', blank=True,
                                   null=True)  # Answer file shown after completion
    allow_resubmission = models.BooleanField(default=True)
    requires_approval = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    class Meta:
        db_table = 'tasks'
        ordering = ['created_at']


class TaskQuestion(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='questions')
    question = models.TextField()
    description = models.TextField(blank=True, null=True)  # Per-question explanation/description
    image = models.ImageField(upload_to='question_images/', blank=True, null=True)  # Per-question image
    options = models.JSONField()
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
    modules = models.ManyToManyField(Module, blank=True, related_name='user_courses')  # For modular courses
    granted_by = models.CharField(max_length=10, choices=GRANTED_BY_CHOICES)
    granted_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} - {self.category.name}"

    def has_access_to_module(self, module):
        """Check if user has access to a specific module"""
        if not self.category.is_modular:
            return True  # Non-modular courses give full access
        return self.modules.filter(id=module.id).exists()

    def has_access_to_video(self, video):
        """Check if user has access to a specific video"""
        if not self.category.is_modular or not video.module:
            return True  # Non-modular or video without module
        return self.modules.filter(id=video.module.id).exists()

    class Meta:
        db_table = 'user_courses'
        unique_together = ['user', 'category']
        ordering = ['-granted_at']


class StudentProgress(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='progress', null=True)
    device_id = models.CharField(max_length=64, null=True, blank=True, unique=True)
    completed_videos = models.JSONField(default=list)  # List of video IDs
    completed_tasks = models.JSONField(default=list)  # List of task IDs

    def __str__(self):
        return f"{self.user.username if self.user else self.device_id} - Progress"

    class Meta:
        db_table = 'student_progress'


class TaskSubmission(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='task_submissions', null=True, blank=True)
    device_id = models.CharField(max_length=64, null=True, blank=True)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='submissions')
    file = models.FileField(upload_to='submissions/', blank=True, null=True)
    text_content = models.TextField(blank=True, null=True)
    answers = models.JSONField(default=dict, blank=True)
    score = models.IntegerField(default=0)
    total = models.IntegerField(default=0)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    feedback = models.TextField(blank=True, null=True)
    reviewed_at = models.DateTimeField(blank=True, null=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        owner = self.user.username if self.user else self.device_id
        return f"{owner} - {self.task.title}"

    class Meta:
        db_table = 'task_submissions'
        ordering = ['-submitted_at']
