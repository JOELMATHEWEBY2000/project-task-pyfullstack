from rest_framework.permissions import BasePermission


def get_role(user):

    if user.is_superuser:
        return 'admin'

    profile = getattr(user, 'profile', None)

    return profile.role if profile else 'employee'


class IsAdminOrManager(BasePermission):

    def has_permission(self, request, view):

        return get_role(request.user) in [
            'admin',
            'manager'
        ]