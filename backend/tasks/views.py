from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Task
from .serializers import TaskSerializer
from projects.permissions import get_role, IsAdminOrManager


class TaskViewSet(viewsets.ModelViewSet):

    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role = get_role(user)

        queryset = Task.objects.select_related(
            "project",
            "team",
            "assigned_to"
        ).prefetch_related("team__members")

        if role == "admin":
            pass

        elif role == "manager":
            queryset = queryset.filter(
                project__manager=user
            )

        else:
            queryset = queryset.filter(
                Q(assigned_to=user) |
                Q(team__members=user)
            ).distinct()

        project = self.request.query_params.get("project")
        task_status = self.request.query_params.get("status")
        priority = self.request.query_params.get("priority")

        if project:
            queryset = queryset.filter(project_id=project)

        if task_status:
            queryset = queryset.filter(status=task_status)

        if priority:
            queryset = queryset.filter(priority=priority)

        return queryset.order_by("-created_at")

    def get_permissions(self):
        if self.action in [
            "create",
            "update",
            "partial_update",
            "destroy"
        ]:
            return [IsAdminOrManager()]

        return super().get_permissions()

    def perform_create(self, serializer):
        user = self.request.user
        role = get_role(user)

        project = serializer.validated_data["project"]

        if role == "manager" and project.manager != user:
            raise PermissionDenied(
                "You can only create tasks in your own projects."
            )

        serializer.save()

    def perform_update(self, serializer):
        user = self.request.user
        role = get_role(user)

        task = self.get_object()

        if role == "manager" and task.project.manager != user:
            raise PermissionDenied(
                "You cannot update this task."
            )

        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        role = get_role(user)

        if role == "manager" and instance.project.manager != user:
            raise PermissionDenied(
                "You cannot delete this task."
            )

        instance.delete()

    @action(detail=True, methods=["patch"])
    def status(self, request, pk=None):
        task = self.get_object()

        new_status = request.data.get("status")

        allowed_statuses = [
            "todo",
            "in_progress",
            "completed"
        ]

        if new_status not in allowed_statuses:
            return Response(
                {"error": "Invalid task status."},
                status=status.HTTP_400_BAD_REQUEST
            )

        role = get_role(request.user)

        if role == "employee":
            is_assigned = task.assigned_to_id == request.user.id
            is_team_member = (
                task.team.members.filter(
                    id=request.user.id
                ).exists()
                if task.team_id else False
            )

            if not (is_assigned or is_team_member):
                raise PermissionDenied(
                    "You can only update tasks assigned to you or your teams."
                )

        task.status = new_status
        task.save(update_fields=["status"])

        return Response(TaskSerializer(task).data)