from rest_framework import serializers
from . import models

class GradeEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = models.GradeEntry
        fields = ('id', 'component', 'name', 'score', 'max_score')
        read_only_fields = ('id',)

class GradeComponentSerializer(serializers.ModelSerializer):
    entries = GradeEntrySerializer(source='grade_entries', many=True, read_only=True)

    class Meta:
        model = models.GradeComponent
        fields = ('id', 'course', 'name', 'weight', 'entries')
        read_only_fields = ('id',)

class CourseSerializer(serializers.ModelSerializer):
    grade_components = GradeComponentSerializer(many=True, read_only=True)

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
            'units',
            'grade_components',
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
            'deadline',
            'is_completed',
            'mark_as_completed_date',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')