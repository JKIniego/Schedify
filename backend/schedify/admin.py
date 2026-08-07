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

@admin.register(models.Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'priority', 'is_completed', 'created_at')
    list_filter = ('priority', 'is_completed', 'course')
    search_fields = ('title', 'description', 'course__name')

@admin.register(models.GradeComponent)
class GradeComponentAdmin(admin.ModelAdmin):
    list_display = ('name', 'course', 'weight')
    list_filter = ('course',)
    search_fields = ('name', 'course__name')

@admin.register(models.GradeEntry)
class GradeEntryAdmin(admin.ModelAdmin):
    list_display = ('name', 'component', 'score', 'max_score')
    list_filter = ('component',)
    search_fields = ('name', 'component__name')