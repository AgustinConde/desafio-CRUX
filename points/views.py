from django.contrib import messages
from django.http import HttpResponseNotAllowed, JsonResponse
from django.shortcuts import redirect
from django.urls import reverse_lazy
from django.views.decorators.http import require_GET
from django.views.generic import CreateView, DeleteView, ListView, UpdateView

from .forms import PointForm
from .models import Point


class PointListView(ListView):
    model = Point
    context_object_name = "points"
    template_name = "points/point_list.html"


class PointCreateView(CreateView):
    model = Point
    form_class = PointForm
    success_url = reverse_lazy("points:list")

    def get(self, request, *args, **kwargs):
        return HttpResponseNotAllowed(["POST"])

    def form_valid(self, form):
        messages.success(self.request, "El punto se creó correctamente.")
        return super().form_valid(form)

    def form_invalid(self, form):
        errors = " ".join(
            error for field_errors in form.errors.values()
            for error in field_errors
        )
        messages.error(
            self.request,
            f"No se pudo crear el punto. {errors}",
        )
        return redirect(self.success_url)


class PointUpdateView(UpdateView):
    model = Point
    form_class = PointForm
    success_url = reverse_lazy("points:list")

    def get(self, request, *args, **kwargs):
        return HttpResponseNotAllowed(["POST"])

    def form_valid(self, form):
        messages.success(self.request, "El punto se actualizó correctamente.")
        return super().form_valid(form)

    def form_invalid(self, form):
        errors = " ".join(
            error for field_errors in form.errors.values()
            for error in field_errors
        )
        messages.error(
            self.request,
            f"No se pudo actualizar el punto. {errors}",
        )
        return redirect(self.success_url)


class PointDeleteView(DeleteView):
    model = Point
    success_url = reverse_lazy("points:list")

    def get(self, request, *args, **kwargs):
        return HttpResponseNotAllowed(["POST"])

    def form_valid(self, form):
        messages.success(self.request, "El punto se eliminó correctamente.")
        return super().form_valid(form)


@require_GET
def point_list_api(request):
    points = [
        {
            "id": point.id,
            "name": point.name,
            "description": point.description,
            "latitude": float(point.latitude),
            "longitude": float(point.longitude),
            "status": point.status,
            "status_label": point.get_status_display(),
        }
        for point in Point.objects.all()
    ]
    return JsonResponse({"points": points})
