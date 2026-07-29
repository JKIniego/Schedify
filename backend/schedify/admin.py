from django.contrib import admin
from . import models

@admin.register(models.ClassSchedule)
class ClassScheduleAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'is_active', 'created_at', 'updated_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('title', 'user__username', 'user__email')
    ordering = ('-is_active', '-created_at')

@admin.register(models.Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('name', 'schedule', 'room', 'days', 'start_time', 'end_time')
    list_filter = ('schedule', 'start_time')
    search_fields = ('name', 'room', 'schedule__title')