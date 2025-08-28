# Generated manually on 2025-01-28
# Fix database column mappings for ForeignKey fields

from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    dependencies = [
        ('dirReactFinal_core', '0006_atoll_party'),
        ('dirReactFinal_directory', '0002_convert_fields_to_foreign_keys'),
    ]

    operations = [
        # No operations needed - the model already has the correct ForeignKey definitions
        # with db_column specified to map to the existing database columns
        # This migration serves as a marker that the column mappings are now correct
    ]
