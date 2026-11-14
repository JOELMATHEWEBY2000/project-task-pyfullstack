from rest_framework.permissions import BasePermission
from projects.permissions import get_role


class IsAdminOrManager(BasePermission):

    def has_permission(self, request, view):

        return get_role(request.user) in [
            'admin',
            'manager'
        ]