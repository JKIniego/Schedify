from rest_framework import serializers
from . import models

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Course
        fields = (
            'id',
            'name',
            'room',
            'days',
            'start_time',
            'end_time',
            'hex_code',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

class ClassScheduleSerializer(serializers.ModelSerializer):
    courses = CourseSerializer(many=True, read_only=True)

    class Meta:
        model = models.ClassSchedule
        fields = ('id', 'title', 'is_active', 'courses', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

class TaskSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)

    class Meta:
        model = models.Task
        fields = (
            'id',
            'course',
            'course_name',
            'title',
            'description',
            'priority',
            'is_completed',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')