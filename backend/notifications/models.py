from django.db import models
from django.contrib.auth.models import User


# Create your models here.

class Notification(models.Model):

    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notifications"
    )

    message = models.CharField(max_length=255)

    notification_type = models.CharField(
        max_length=50,
        choices=[
            ("task_assigned", "Task Assigned"),
            ("task_completed", "Task Completed"),
            ("task_overdue", "Task Overdue"),
            ("general", "General"),
        ],
        default="general"
    )

    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.recipient.username}: {self.message}"