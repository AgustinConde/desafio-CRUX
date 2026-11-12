from django.core.management import BaseCommand, call_command

from points.models import Point


class Command(BaseCommand):
    help = "Carga puntos de ejemplo cuando la base de datos está vacía."

    def handle(self, *args, **options):
        if Point.objects.exists():
            self.stdout.write("La base ya contiene puntos; no se cargaron ejemplos.")
            return

        call_command("loaddata", "initial_points", verbosity=0)
        self.stdout.write(self.style.SUCCESS("Puntos de ejemplo cargados."))
