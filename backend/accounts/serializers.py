from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import UserProfile


class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        min_length=8
    )

    role = serializers.ChoiceField(
        choices=UserProfile.ROLE_CHOICES,
        default='employee'
    )

    class Meta:
        model = User

        fields = [
            'id',
            'username',
            'email',
            'password',
            'role'
        ]

    def create(self, validated_data):

        role = validated_data.pop('role', 'employee')

        user = User.objects.create_user(
            **validated_data
        )

        UserProfile.objects.create(
            user=user,
            role=role
        )

        return user

    def validate_email(self, value):

        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "Email already exists"
            )

        return value


class UserSerializer(serializers.ModelSerializer):

    role = serializers.SerializerMethodField()

    class Meta:
        model = User

        fields = [
            'id',
            'username',
            'email',
            'role'
        ]

    def get_role(self, obj):

        if obj.is_superuser:
            return 'admin'

        profile = getattr(obj, 'profile', None)

        return profile.role if profile else 'employee'

class AdminUserSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        required=False,
        min_length=8
    )

    role = serializers.ChoiceField(
        choices=UserProfile.ROLE_CHOICES,
        required=False,
        write_only=True
    )

    class Meta:
        model = User

        fields = [
            'id',
            'username',
            'email',
            'password',
            'role',
            'is_active',
            'date_joined'
        ]

        read_only_fields = ['id', 'date_joined']

    def validate_email(self, value):

        queryset = User.objects.filter(email=value)

        if self.instance:
            queryset = queryset.exclude(
                id=self.instance.id
            )

        if queryset.exists():
            raise serializers.ValidationError(
                "Email already exists."
            )

        return value

    def create(self, validated_data):

        password = validated_data.pop('password')
        role = validated_data.pop('role', 'employee')

        user = User.objects.create_user(
            password=password,
            **validated_data
        )

        UserProfile.objects.create(
            user=user,
            role=role
        )

        return user

    def update(self, instance, validated_data):

        password = validated_data.pop('password', None)
        role = validated_data.pop('role', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()

        if role is not None:

            profile, created = UserProfile.objects.get_or_create(
                user=instance
            )

            profile.role = role
            profile.save()

        return instance

    def to_representation(self, instance):

        data = super().to_representation(instance)

        if instance.is_superuser:
            data['role'] = 'admin'
        else:
            profile = getattr(instance, 'profile', None)

            data['role'] = (
                profile.role if profile else 'employee'
            )

        return data

class ProfileUpdateSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = ["username", "email"]

    def validate_email(self, value):
        user = self.instance

        if User.objects.exclude(pk=user.pk).filter(
            email__iexact=value
        ).exists():
            raise serializers.ValidationError(
                "This email address is already in use."
            )

        return value

class ChangePasswordSerializer(serializers.Serializer):

    current_password = serializers.CharField(
        write_only=True
    )

    new_password = serializers.CharField(
        write_only=True,
        min_length=8
    )

    def validate_current_password(self, value):
        user = self.context["request"].user

        if not user.check_password(value):
            raise serializers.ValidationError(
                "Current password is incorrect."
            )

        return value

    def validate_new_password(self, value):
        validate_password(value, self.context["request"].user)
        return value

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(
            self.validated_data["new_password"]
        )
        user.save()

        return user