from django import forms

from .models import Point


class PointForm(forms.ModelForm):
    class Meta:
        model = Point
        fields = ["name", "description", "latitude", "longitude", "status"]
        widgets = {
            "description": forms.Textarea(attrs={"rows": 4}),
        }
