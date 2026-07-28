from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import ClassSchedule
from .serializers import ClassScheduleSerializer

class ClassScheduleListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        schedules = ClassSchedule.objects.filter(user=request.user)
        serializer = ClassScheduleSerializer(schedules, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        serializer = ClassScheduleSerializer(data=request.data)
        if serializer.is_valid():
            # If new schedule is set to active, deactivate all other schedules for this user
            if serializer.validated_data.get('is_active', True):
                ClassSchedule.objects.filter(user=request.user, is_active=True).update(is_active=False)

            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ClassScheduleDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, pk, user):
        try:
            return ClassSchedule.objects.get(pk=pk, user=user)
        except ClassSchedule.DoesNotExist:
            return None
        
    def get(self, request, pk):
        schedule = self.get_object(pk, request.user)
        if not schedule:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(ClassScheduleSerializer(schedule).data)
    
    def patch(self, request, pk):
        schedule = self.get_object(pk, request.user)
        if not schedule:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ClassScheduleSerializer(schedule, data=request.data, partial=True)
        if serializer.is_valid():
            if serializer.validated_data.get('is_active', False):
                ClassSchedule.objects.filter(user=request.user, is_active=True).exclude(pk=pk).update(is_active=False)

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
                ClassSchedule.objects.filter(user=request.user)
                .order_by('-created_at')
                .first()
            )
            if latest_schedule:
                latest_schedule.is_active = True
                latest_schedule.save()

        return Response(status=status.HTTP_204_NO_CONTENT)