from django.urls import path
from . import views

urlpatterns = [
    # ======== Class schdedules ========
    path('classes/', views.ClassScheduleListCreateView.as_view()),
    path('classes/<int:pk>/', views.ClassScheduleDetailView.as_view()),
    
    # ======== Courses ========
    path('classes/<int:schedule_id>/courses/', views.CourseListCreateView.as_view()),
    path('courses/<int:pk>/', views.CourseDetailView.as_view()),

    # ======== Tasks ========
    path('classes/<int:schedule_id>/tasks/', views.TaskListCreateView.as_view()),
    path('tasks/<int:pk>/', views.TaskDetailView.as_view()),
]