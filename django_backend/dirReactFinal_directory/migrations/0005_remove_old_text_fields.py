# Generated manually on 2025-01-28
# Remove old text field columns that are no longer needed

from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('dirReactFinal_core', '0006_atoll_party'),
        ('dirReactFinal_directory', '0004_custom_field_alterations'),
    ]

    operations = [
        # Remove the old text field columns that are no longer needed
        # These fields have been replaced by ForeignKey fields with db_column mappings
        migrations.RemoveField(
            model_name='phonebookentry',
            name='atoll',
        ),
        migrations.RemoveField(
            model_name='phonebookentry',
            name='island',
        ),
        migrations.RemoveField(
            model_name='phonebookentry',
            name='party',
        ),
        migrations.RemoveField(
            model_name='phonebookentry',
            name='gender',
        ),
    ]
