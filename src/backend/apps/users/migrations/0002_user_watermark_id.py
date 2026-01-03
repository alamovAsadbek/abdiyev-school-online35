# Generated migration for adding watermark_id field

from django.db import migrations, models
import uuid


def generate_watermark_ids(apps, schema_editor):
    """Generate unique watermark IDs for existing users"""
    User = apps.get_model('users', 'User')
    for user in User.objects.all():
        if not user.watermark_id:
            user.watermark_id = uuid.uuid4().hex[:8].upper()
            user.save()


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='watermark_id',
            field=models.CharField(blank=True, editable=False, max_length=8, null=True, unique=True),
        ),
        migrations.RunPython(generate_watermark_ids, reverse_code=migrations.RunPython.noop),
    ]
