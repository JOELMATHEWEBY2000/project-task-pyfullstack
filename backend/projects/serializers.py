
from rest_framework import serializers
from .models import Project
from teams.models import Team


class ProjectSerializer(serializers.ModelSerializer):

    teams = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Team.objects.all(),
        required=False
    )

    team_names = serializers.SerializerMethodField()

    manager_name = serializers.CharField(
        source='manager.username',
        read_only=True
    )

    member_names = serializers.SerializerMethodField()

    class Meta:
        model = Project

        fields = [
            'id',
            'name',
            'description',
            'manager',
            'manager_name',
            'teams',
            'team_names',
            'members',
            'member_names',
            'start_date',
            'end_date',
            'status',
            'created_at'
        ]

        read_only_fields = ['manager', 'created_at']

    # Get team names
    def get_team_names(self, obj):
        return list(
            obj.teams.values_list('name', flat=True)
        )

    # Get project member names
    def get_member_names(self, obj):
        return list(
            obj.members.values_list('username', flat=True)
        )

    # Validate project dates
    def validate(self, data):

        start = data.get(
            'start_date',
            getattr(self.instance, 'start_date', None)
        )

        end = data.get(
            'end_date',
            getattr(self.instance, 'end_date', None)
        )

        if start and end and end < start:
            raise serializers.ValidationError(
                "End date cannot be before date"
            )

        return data

    # Validate project members
    def validate_members(self, members):

        if any(not user.is_active for user in members):
            raise serializers.ValidationError(
                "Inactive users cannot be project members"
            )

        return members

    # Validate project teams based on role
    def validate_teams(self, teams):

        request = self.context.get("request")

        if not request:
            return teams

        user = request.user

        if user.is_superuser:
            return teams

        profile = getattr(user, "profile", None)
        role = profile.role if profile else "employee"

        if role == "admin":
            return teams

        if role == "manager":

            for team in teams:

                if team.manager != user:
                    raise serializers.ValidationError(
                        f"You cannot assign the team '{team.name}'."
                    )

            return teams

        raise serializers.ValidationError(
            "Employees cannot assign teams to projects."
        )
