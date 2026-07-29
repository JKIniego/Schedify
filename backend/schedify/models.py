from django.db import models
from django.contrib.auth.models import User

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

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_time']

    def __str__(self):
        return f"{self.name} ({self.room})"