from django.urls import include, path


urlpatterns = [
    path("", include("points.urls")),
]
