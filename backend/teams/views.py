
from django.contrib.auth.models import User

from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from .models import Team
from .serializers import TeamSerializer

from projects.permissions import IsAdminOrManager, get_role
from accounts.serializers import UserSerializer


class TeamViewSet(viewsets.ModelViewSet):

    serializer_class = TeamSerializer
    permission_classes = [IsAdminOrManager]

    def get_queryset(self):
        user = self.request.user
        role = get_role(user)

        if role == "admin":
            return Team.objects.all()

        return Team.objects.filter(
            manager=user
        ).distinct()

    def perform_create(self, serializer):
        user = self.request.user
        role = get_role(user)

        if role == "manager":
            serializer.save(manager=user)
        else:
            serializer.save()

    def perform_update(self, serializer):
        user = self.request.user
        role = get_role(user)

        if role == "manager":
            if serializer.instance.manager_id != user.id:
                raise PermissionDenied(
                    "You can only update your own teams."
                )

            serializer.save(manager=user)
        else:
            serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        role = get_role(user)

        if role == "manager" and instance.manager_id != user.id:
            raise PermissionDenied(
                "You can only delete your own teams."
            )

        instance.delete()


class AvailableEmployeesView(APIView):

    permission_classes = [
        IsAuthenticated,
        IsAdminOrManager
    ]

    def get(self, request):

        employees = User.objects.filter(
            is_active=True,
            profile__role="employee"
        ).order_by("username")

        serializer = UserSerializer(
            employees,
            many=True
        )

        return Response(serializer.data)
