
from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated

from .models import Project
from .serializers import ProjectSerializer
from .permissions import get_role, IsAdminOrManager
from .utils import sync_project_members


class ProjectViewSet(viewsets.ModelViewSet):

    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    # Get projects based on user role
    def get_queryset(self):

        user = self.request.user
        role = get_role(user)

        if role == 'admin':
            return Project.objects.all()

        if role == 'manager':
            return Project.objects.filter(manager=user)

        return Project.objects.filter(members=user)

    # Set permissions based on action
    def get_permissions(self):

        if self.action in [
            'create',
            'update',
            'partial_update',
            'destroy'
        ]:
            return [IsAdminOrManager()]

        return super().get_permissions()

    # Create project
    def perform_create(self, serializer):

        user = self.request.user
        role = get_role(user)

        if role not in ['admin', 'manager']:
            raise PermissionDenied(
                "Only admins and managers can create projects."
            )

        project = serializer.save(manager=user)

        sync_project_members(project)

    # Update project
    def perform_update(self, serializer):

        user = self.request.user
        role = get_role(user)

        project = self.get_object()

        if (
            role == 'manager'
            and project.manager_id != user.id
        ):
            raise PermissionDenied(
                "You can only update your own projects."
            )

        updated_project = serializer.save()

        sync_project_members(updated_project)

    # Delete project
    def perform_destroy(self, instance):

        user = self.request.user
        role = get_role(user)

        if (
            role == 'manager'
            and instance.manager_id != user.id
        ):
            raise PermissionDenied(
                "You cannot delete another manager's project."
            )

        instance.delete()
