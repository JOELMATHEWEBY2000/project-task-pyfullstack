def sync_project_members(project):
    """
    Project members are automatically collected
    from all teams assigned to the project.
    """

    team_members = set()

    for team in project.teams.all():
        for member in team.members.all():
            if member.is_active:
                team_members.add(member.id)

    project.members.set(team_members)