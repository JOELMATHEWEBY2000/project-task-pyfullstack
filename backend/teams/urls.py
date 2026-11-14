from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import TeamViewSet, AvailableEmployeesView

router = DefaultRouter()
router.register(
    "teams",
    TeamViewSet,
    basename="teams"
)

urlpatterns = [
    path(
        "available-employees/",
        AvailableEmployeesView.as_view(),
        name="available-employees"
    ),
    path("", include(router.urls)),
]
