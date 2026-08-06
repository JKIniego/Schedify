from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class ClassSchedule(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='schedules')
    title = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_active', '-created_at']

    def __str__(self):
        return f"{self.title} ({self.user.username})"

class Course(models.Model):
    schedule = models.ForeignKey(ClassSchedule, on_delete=models.CASCADE, related_name='courses')
    name = models.CharField(max_length=100)
    room = models.CharField(max_length=50)
    days = models.JSONField(default=list)
    
    start_time = models.TimeField()
    end_time = models.TimeField()
    
    hex_code = models.CharField(max_length=7, default="#A5D6A7")
    units = models.PositiveSmallIntegerField(default=3)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_time']

    def __str__(self):
        return f"{self.name} ({self.room})"

class Task(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    deadline = models.DateTimeField(default=timezone.now)

    is_completed = models.BooleanField(default=False)
    mark_as_completed_date = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['is_completed', '-deadline', '-created_at']

    def save(self, *args, **kwargs):
        if self.pk:
            old_instance = Task.objects.get(pk=self.pk)

            if not old_instance.is_completed and self.is_completed:
                self.mark_as_completed_date = timezone.now()
            elif old_instance.is_completed and not self.is_completed:
                self.mark_as_completed_date = None
        else:
            if self.is_completed:
                self.mark_as_completed_date = timezone.now()
            else:
                self.mark_as_completed_date = None

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} - {self.course.name}"

class GradeComponent(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='grade_components')
    name = models.CharField(max_length=255)
    weight = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('course', 'name')

    def __str__(self):
        return f"{self.course} - {self.name}"

class GradeEntry(models.Model):
    component = models.ForeignKey(GradeComponent, on_delete=models.CASCADE, related_name='grade_entries')
    name = models.CharField(max_length=255)
    score = models.FloatField(default=0)
    max_score = models.FloatField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.component} ({self.component.course})"