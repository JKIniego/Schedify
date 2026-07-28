from django.urls import path
from . import views

urlpatterns = [
    path('classes/', views.ClassScheduleListCreateView.as_view()),
    path('classes/<int:pk>/', views.ClassScheduleDetailView.as_view()),
]