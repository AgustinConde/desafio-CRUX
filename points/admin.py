from django.contrib import admin

from .models import Point


@admin.register(Point)
class PointAdmin(admin.ModelAdmin):
    list_display = ("name", "status", "latitude", "longitude")
    list_filter = ("status",)
    search_fields = ("name", "description")
