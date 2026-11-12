from django.urls import path

from .views import (
    PointCreateView,
    PointDeleteView,
    PointListView,
    PointUpdateView,
)

app_name = "points"

urlpatterns = [
    path("", PointListView.as_view(), name="list"),
    path("points/new/", PointCreateView.as_view(), name="create"),
    path("points/<int:pk>/edit/", PointUpdateView.as_view(), name="update"),
    path("points/<int:pk>/delete/", PointDeleteView.as_view(), name="delete"),
]
