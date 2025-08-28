# Generated manually on 2025-01-28
# Resolve Django migration field mismatch by marking fields as already existing

from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    dependencies = [
        ('dirReactFinal_core', '0006_atoll_party'),
        ('dirReactFinal_directory', '0006_mark_schema_complete'),
    ]

    operations = [
        # These fields already exist in the database and are working correctly
        # Django's migration system is confused about their existence
        # This migration explicitly declares them to resolve the mismatch
        
        # The atoll field already exists as a ForeignKey with db_column='atoll_fk_id'
        migrations.AddField(
            model_name='phonebookentry',
            name='atoll',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='entries',
                to='dirReactFinal_core.atoll',
                db_column='atoll_fk_id'
            ),
        ),
        
        # The island field already exists as a ForeignKey with db_column='island_fk_id'
        migrations.AddField(
            model_name='phonebookentry',
            name='island',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='entries',
                to='dirReactFinal_core.island',
                db_column='island_fk_id'
            ),
        ),
        
        # The party field already exists as a ForeignKey with db_column='party_fk_id'
        migrations.AddField(
            model_name='phonebookentry',
            name='party',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='entries',
                to='dirReactFinal_core.party',
                db_column='party_fk_id'
            ),
        ),
        
        # The gender field already exists as a CharField with db_column='gender_choice'
        migrations.AddField(
            model_name='phonebookentry',
            name='gender',
            field=models.CharField(
                blank=True,
                choices=[('M', 'Male'), ('F', 'Female'), ('O', 'Other')],
                max_length=10,
                null=True,
                db_column='gender_choice'
            ),
        ),
    ]
