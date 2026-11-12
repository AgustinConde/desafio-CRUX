from django.contrib import messages
from django.urls import reverse_lazy
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
    template_name = "points/point_form.html"
    success_url = reverse_lazy("points:list")

    def form_valid(self, form):
        messages.success(self.request, "El punto se creó correctamente.")
        return super().form_valid(form)


class PointUpdateView(UpdateView):
    model = Point
    form_class = PointForm
    template_name = "points/point_form.html"
    success_url = reverse_lazy("points:list")

    def form_valid(self, form):
        messages.success(self.request, "El punto se actualizó correctamente.")
        return super().form_valid(form)


class PointDeleteView(DeleteView):
    model = Point
    template_name = "points/point_confirm_delete.html"
    success_url = reverse_lazy("points:list")

    def form_valid(self, form):
        messages.success(self.request, "El punto se eliminó correctamente.")
        return super().form_valid(form)
