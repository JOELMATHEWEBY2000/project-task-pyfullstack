from rest_framework import generics,viewsets,status
from rest_framework.permissions import AllowAny,IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied,ValidationError
from django.contrib.auth.models import User


from projects.permissions import get_role
from .permissions import IsAdminRole
from .serializers import RegisterSerializer, UserSerializer, AdminUserSerializer, ProfileUpdateSerializer,ChangePasswordSerializer


# Create your views here.


class RegisterView(generics.CreateAPIView):

    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]




class ProfileView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=True
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response({
            "message": "Profile updated successfully.",
            "user": UserSerializer(request.user).data
        }, status=status.HTTP_200_OK)



class UserListView(generics.ListAPIView):

    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        user = self.request.user
        role = get_role(user)

        if role == 'admin':
            return User.objects.filter(
                is_active=True
            ).order_by('username')

        if role == 'manager':
            return User.objects.filter(
                team_projects__manager=user,
                is_active=True
            ).distinct().order_by('username')

        raise PermissionDenied(
            "You do not have permission to view the user list."
        )

class AdminUserViewSet(viewsets.ModelViewSet):

    queryset = User.objects.all().order_by('-date_joined')

    serializer_class = AdminUserSerializer

    permission_classes = [IsAdminRole]

    def perform_update(self, serializer):

        if (
            serializer.instance == self.request.user
            and serializer.validated_data.get('is_active') is False
        ):
            raise ValidationError(
                "You cannot deactivate your own account."
            )

        serializer.save()

    def perform_destroy(self, instance):

        if instance == self.request.user:
            raise ValidationError(
                "You cannot deactivate your own account."
            )

        instance.is_active = False
        instance.save(update_fields=['is_active'])

class ChangePasswordView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={"request": request}
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response({
            "message": "Password changed successfully. Please log in again."
        })