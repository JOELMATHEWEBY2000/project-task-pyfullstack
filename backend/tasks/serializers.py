from rest_framework import serializers
from .models import Task


class TaskSerializer(serializers.ModelSerializer):

    project_name = serializers.CharField(
        source="project.name",
        read_only=True
    )

    team_name = serializers.CharField(
        source="team.name",
        read_only=True,
        allow_null=True
    )

    assigned_name = serializers.CharField(
        source="assigned_to.username",
        read_only=True,
        allow_null=True
    )

    project_members = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "description",
            "project",
            "project_name",
            "team",
            "team_name",
            "assigned_to",
            "assigned_name",
            "project_members",
            "priority",
            "status",
            "due_date",
            "created_at",
        ]
        read_only_fields = ["created_at"]

    def get_project_members(self, obj):
        return [
            {
                "id": member.id,
                "username": member.username
            }
            for member in obj.project.members.filter(is_active=True)
        ]

    def validate(self, data):

        assigned_to = data.get(
            "assigned_to",
            getattr(self.instance, "assigned_to", None)
        )

        if assigned_to:
            if not assigned_to.is_active:
                raise serializers.ValidationError({
                    "assigned_to": "Cannot assign a task to an inactive employee."
                })

            project = data.get(
                "project",
                getattr(self.instance, "project", None)
            )

            team = data.get(
                "team",
                getattr(self.instance, "team", None)
            )

            if project and not project.members.filter(
                id=assigned_to.id
            ).exists():
                raise serializers.ValidationError({
                    "assigned_to": "Employee must belong to the selected project."
                })

            if team and not team.members.filter(
                id=assigned_to.id
            ).exists():
                raise serializers.ValidationError({
                    "assigned_to": "Employee must belong to the selected team."
                })

        return data
