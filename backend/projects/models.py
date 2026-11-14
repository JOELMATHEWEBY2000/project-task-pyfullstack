from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class Project(models.Model):

    STATUS_CHOICES = [
        ('planning', 'Planning'),
        ('active', 'Active'),
        ('completed', 'Completed'),
    ]

    name = models.CharField(max_length=200)

    description = models.TextField()

    manager = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='managed_projects'
    )

    members = models.ManyToManyField(
        User,
        related_name='team_projects',
        blank=True
    )

    teams = models.ManyToManyField(
    'teams.Team',
    related_name='projects',
    blank=True
    )

    start_date = models.DateField()

    end_date = models.DateField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='planning'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name