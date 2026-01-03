# Generated migration for adding video file and thumbnail fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0005_alter_video_description'),
    ]

    operations = [
        migrations.AddField(
            model_name='video',
            name='video_file',
            field=models.FileField(blank=True, null=True, upload_to='videos/'),
        ),
        migrations.AddField(
            model_name='video',
            name='thumbnail_url',
            field=models.URLField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='video',
            name='thumbnail',
            field=models.ImageField(blank=True, null=True, upload_to='thumbnails/'),
        ),
    ]
