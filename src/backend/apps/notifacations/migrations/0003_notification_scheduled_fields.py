from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notifacations', '0002_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='notification',
            name='status',
            field=models.CharField(choices=[('pending', 'Pending'), ('sent', 'Sent'), ('scheduled', 'Scheduled')], default='sent', max_length=10),
        ),
        migrations.AddField(
            model_name='notification',
            name='scheduled_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
