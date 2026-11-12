from io import StringIO

from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.test import TestCase
from django.urls import reverse

from .models import Point


class PointModelTests(TestCase):
    def test_coordinates_must_be_within_valid_ranges(self):
        point = Point(name="Invalid point", latitude=91, longitude=-181)

        with self.assertRaises(ValidationError):
            point.full_clean()

    def test_coordinates_accept_valid_boundaries(self):
        point = Point(
            name="Boundary point",
            latitude=-90,
            longitude=180,
        )

        point.full_clean()


class PointCrudTests(TestCase):
    def setUp(self):
        self.point = Point.objects.create(
            name="Original point",
            description="Original description",
            latitude=-34.6037,
            longitude=-58.3816,
        )

    def test_create_point(self):
        response = self.client.post(
            reverse("points:create"),
            {
                "name": "New point",
                "description": "A new description",
                "latitude": "-34.60",
                "longitude": "-58.38",
                "status": Point.Status.ACTIVE,
            },
        )

        self.assertRedirects(response, reverse("points:list"))
        self.assertTrue(Point.objects.filter(name="New point").exists())

    def test_create_endpoint_only_accepts_post(self):
        response = self.client.get(reverse("points:create"))

        self.assertEqual(response.status_code, 405)

    def test_create_point_rejects_invalid_coordinates(self):
        response = self.client.post(
            reverse("points:create"),
            {
                "name": "Invalid point",
                "description": "Invalid coordinates",
                "latitude": "91",
                "longitude": "-58.38",
                "status": Point.Status.ACTIVE,
            },
        )

        self.assertRedirects(response, reverse("points:list"))
        self.assertFalse(Point.objects.filter(name="Invalid point").exists())

    def test_update_point(self):
        response = self.client.post(
            reverse("points:update", args=[self.point.pk]),
            {
                "name": "Updated point",
                "description": "Updated description",
                "latitude": "-34.60",
                "longitude": "-58.38",
                "status": Point.Status.INACTIVE,
            },
        )

        self.assertRedirects(response, reverse("points:list"))
        self.point.refresh_from_db()
        self.assertEqual(self.point.name, "Updated point")
        self.assertEqual(self.point.status, Point.Status.INACTIVE)

    def test_delete_point(self):
        response = self.client.post(
            reverse("points:delete", args=[self.point.pk])
        )

        self.assertRedirects(response, reverse("points:list"))
        self.assertFalse(Point.objects.filter(pk=self.point.pk).exists())

    def test_update_endpoint_only_accepts_post(self):
        response = self.client.get(
            reverse("points:update", args=[self.point.pk])
        )

        self.assertEqual(response.status_code, 405)

    def test_delete_endpoint_only_accepts_post(self):
        response = self.client.get(
            reverse("points:delete", args=[self.point.pk])
        )

        self.assertEqual(response.status_code, 405)

    def test_api_returns_points_as_json(self):
        response = self.client.get(reverse("points:api-list"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {
            "points": [
                {
                    "id": self.point.id,
                    "name": "Original point",
                    "description": "Original description",
                    "latitude": -34.6037,
                    "longitude": -58.3816,
                    "status": "active",
                    "status_label": "Activo",
                }
            ]
        })

    def test_api_only_accepts_get(self):
        response = self.client.post(reverse("points:api-list"))

        self.assertEqual(response.status_code, 405)


class SeedPointsCommandTests(TestCase):
    def test_seed_points_loads_examples_only_once(self):
        output = StringIO()

        call_command("seed_points", stdout=output)
        call_command("seed_points", stdout=output)

        self.assertEqual(Point.objects.count(), 4)
        self.assertTrue(Point.objects.filter(name="UTN Haedo").exists())
        self.assertTrue(Point.objects.filter(name="CRUX MARINE").exists())
        self.assertTrue(
            Point.objects.filter(
                name="Puerto Madero",
                status=Point.Status.INACTIVE,
            ).exists()
        )
