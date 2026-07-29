from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from . import models, serializers

class ClassScheduleListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        schedules = models.ClassSchedule.objects.filter(user=request.user)
        serializer = serializers.ClassScheduleSerializer(schedules, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        serializer = serializers.ClassScheduleSerializer(data=request.data)
        if serializer.is_valid():
            # If new schedule is set to active, deactivate all other schedules for this user
            if serializer.validated_data.get('is_active', True):
                models.ClassSchedule.objects.filter(user=request.user, is_active=True).update(is_active=False)

            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ClassScheduleDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, pk, user):
        try:
            return models.ClassSchedule.objects.get(pk=pk, user=user)
        except models.ClassSchedule.DoesNotExist:
            return None
        
    def get(self, request, pk):
        schedule = self.get_object(pk, request.user)
        if not schedule:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(serializers.ClassScheduleSerializer(schedule).data)
    
    def patch(self, request, pk):
        schedule = self.get_object(pk, request.user)
        if not schedule:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = serializers.ClassScheduleSerializer(schedule, data=request.data, partial=True)
        if serializer.is_valid():
            if serializer.validated_data.get('is_active', False):
                models.ClassSchedule.objects.filter(user=request.user, is_active=True).exclude(pk=pk).update(is_active=False)

            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        schedule = self.get_object(pk, request.user)
        if not schedule:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        
        was_active = schedule.is_active
        schedule.delete()
        
        if was_active:
            latest_schedule = (
                models.ClassSchedule.objects.filter(user=request.user)
                .order_by('-created_at')
                .first()
            )
            if latest_schedule:
                latest_schedule.is_active = True
                latest_schedule.save()

        return Response(status=status.HTTP_204_NO_CONTENT)

class CourseListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, schedule_id):
        courses = models.Course.objects.filter(
            schedule_id=schedule_id, 
            schedule__user=request.user
        )
        serializer = serializers.CourseSerializer(courses, many=True)
        return Response(serializer.data)

    def post(self, request, schedule_id):
        try:
            schedule = models.ClassSchedule.objects.get(id=schedule_id, user=request.user)
        except models.ClassSchedule.DoesNotExist:
            return Response({"detail": "Schedule not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = serializers.CourseSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(schedule=schedule)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CourseDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, pk, user):
        try:
            return models.Course.objects.get(pk=pk, schedule__user=user)
        except models.Course.DoesNotExist:
            return None

    def get(self, request, pk):
        course = self.get_object(pk, request.user)
        if not course:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(serializers.CourseSerializer(course).data)

    def patch(self, request, pk):
        course = self.get_object(pk, request.user)
        if not course:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = serializers.CourseSerializer(course, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        course = self.get_object(pk, request.user)
        if not course:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        course.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)