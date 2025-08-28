# Generated manually on 2025-01-28
# Custom migration to convert text fields to foreign keys with proper data handling
# NOTE: This migration is being skipped because the fields are already foreign keys in the models
# The migration was causing conflicts with existing foreign key definitions

import django.db.models.deletion
from django.db import migrations, models

def convert_party_to_foreign_key(apps, schema_editor):
    """Convert party text values to foreign key references"""
    PhoneBookEntry = apps.get_model('dirReactFinal_directory', 'PhoneBookEntry')
    Party = apps.get_model('dirReactFinal_core', 'Party')
    
    # Create a mapping of party names to IDs
    party_map = {party.name: party.id for party in Party.objects.all()}
    
    # Update records with valid party references
    for entry in PhoneBookEntry.objects.all():
        if entry.party and entry.party in party_map:
            entry.party = party_map[entry.party]
            entry.save()
        else:
            # Clear invalid party references
            entry.party = None
            entry.save()

def convert_island_to_foreign_key(apps, schema_editor):
    """Convert island text values to foreign key references"""
    PhoneBookEntry = apps.get_model('dirReactFinal_directory', 'PhoneBookEntry')
    Island = apps.get_model('dirReactFinal_core', 'Island')
    
    # Create a mapping of island names to IDs
    island_map = {island.name: island.id for island in Island.objects.all()}
    
    # Update records with valid island references
    for entry in PhoneBookEntry.objects.all():
        if entry.island and entry.island in island_map:
            entry.island = island_map[entry.island]
            entry.save()
        else:
            # Clear invalid island references
            entry.island = None
            entry.save()

def convert_atoll_to_foreign_key(apps, schema_editor):
    """Convert atoll text values to foreign key references"""
    PhoneBookEntry = apps.get_model('dirReactFinal_directory', 'PhoneBookEntry')
    Atoll = apps.get_model('dirReactFinal_core', 'Atoll')
    
    # Create a mapping of atoll codes to IDs
    atoll_map = {atoll.code: atoll.id for atoll in Atoll.objects.all()}
    
    # Update records with valid atoll references
    for entry in PhoneBookEntry.objects.all():
        if entry.atoll and entry.atoll in atoll_map:
            entry.atoll = atoll_map[entry.atoll]
            entry.save()
        else:
            # Clear invalid atoll references
            entry.atoll = None
            entry.save()

def reverse_convert_party(apps, schema_editor):
    """Reverse conversion - convert foreign key back to text"""
    PhoneBookEntry = apps.get_model('dirReactFinal_directory', 'PhoneBookEntry')
    Party = apps.get_model('dirReactFinal_core', 'Party')
    
    for entry in PhoneBookEntry.objects.all():
        if entry.party:
            entry.party = entry.party.name
            entry.save()

def reverse_convert_island(apps, schema_editor):
    """Reverse conversion - convert foreign key back to text"""
    PhoneBookEntry = apps.get_model('dirReactFinal_directory', 'PhoneBookEntry')
    
    for entry in PhoneBookEntry.objects.all():
        if entry.island:
            entry.island = entry.island.name
            entry.save()

def reverse_convert_atoll(apps, schema_editor):
    """Reverse conversion - convert foreign key back to text"""
    PhoneBookEntry = apps.get_model('dirReactFinal_directory', 'PhoneBookEntry')
    
    for entry in PhoneBookEntry.objects.all():
        if entry.atoll:
            entry.atoll = entry.atoll.code
            entry.save()

class Migration(migrations.Migration):

    dependencies = [
        ('dirReactFinal_core', '0006_atoll_party'),
        ('dirReactFinal_directory', '0001_initial'),
    ]

    operations = [
        # Migration skipped - fields are already foreign keys in models
        # This prevents conflicts with existing foreign key definitions
        # 
        # Original operations (commented out):
        # migrations.RunPython(convert_party_to_foreign_key, reverse_convert_party),
        # migrations.RunPython(convert_island_to_foreign_key, reverse_convert_island),
        # migrations.RunPython(convert_atoll_to_foreign_key, reverse_convert_atoll),
        # 
        # migrations.AlterField(
        #     model_name='phonebookentry',
        #     name='atoll',
        #     field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='entries', to='dirReactFinal_core.atoll'),
        # ),
        # migrations.AlterField(
        #     model_name='phonebookentry',
        #     name='contact',
        #     field=models.CharField(blank=True, max_length=20, null=True),
        # ),
        # migrations.AlterField(
        #     model_name='phonebookentry',
        #     name='gender',
        #     field=models.CharField(blank=True, choices=[('M', 'Male'), ('F', 'Female'), ('O', 'Other')], null=True),
        # ),
        # migrations.AlterField(
        #     model_name='phonebookentry',
        #     name='island',
        #     field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='entries', to='dirReactFinal_core.island'),
        # ),
        # migrations.AlterField(
        #     model_name='phonebookentry',
        #     name='party',
        #     field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='entries', to='dirReactFinal_core.party'),
        # ),
    ]
