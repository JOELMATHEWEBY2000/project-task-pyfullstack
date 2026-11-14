
from django.contrib.auth.models import User

from rest_framework import serializers

from .models import Team


class TeamSerializer(serializers.ModelSerializer):

    manager_name = serializers.CharField(
        source="manager.username",
        read_only=True
    )

    member_names = serializers.SerializerMethodField()

    members = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=User.objects.filter(is_active=True),
        required=False
    )

    class Meta:
        model = Team

        fields = [
            "id",
            "name",
            "description",
            "manager",
            "manager_name",
            "members",
            "member_names",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
        ]

    def get_member_names(self, obj):
        return list(
            obj.members.values_list(
                "username",
                flat=True
            )
        )

    def validate_members(self, members):

        for member in members:

            if member.is_superuser:
                raise serializers.ValidationError(
                    "Administrators cannot be added as team members."
                )

            profile = getattr(member, "profile", None)

            if not profile or profile.role != "employee":
                raise serializers.ValidationError(
                    f"{member.username} is not an employee."
                )

            if not member.is_active:
                raise serializers.ValidationError(
                    f"{member.username} is inactive."
                )

        return members

    def validate(self, data):

        manager = data.get(
            "manager",
            getattr(self.instance, "manager", None)
        )

        if manager:
            profile = getattr(manager, "profile", None)

            if not manager.is_superuser:
                if not profile or profile.role != "manager":
                    raise serializers.ValidationError({
                        "manager": "Only managers or administrators can manage teams."
                    })

        return data
