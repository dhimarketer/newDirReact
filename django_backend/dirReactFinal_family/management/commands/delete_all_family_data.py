# 2025-01-31: Management command to delete all family data for debugging and testing
# This command should be used with extreme caution as it permanently deletes all family data

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.conf import settings
import logging

from dirReactFinal_family.models import FamilyGroup, FamilyRelationship, FamilyMember

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Delete all family data (families, relationships, members) from the database. USE WITH EXTREME CAUTION!'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Skip confirmation prompt and force deletion',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting anything',
        )

    def handle(self, *args, **options):
        # 2025-01-31: Safety check - prevent accidental execution in production
        if not settings.DEBUG:
            raise CommandError(
                'This command can only be run in DEBUG mode. '
                'Set DEBUG=True in settings.py to enable this command.'
            )

        dry_run = options['dry_run']
        force = options['force']

        # Get counts before deletion
        family_groups_count = FamilyGroup.objects.count()
        family_relationships_count = FamilyRelationship.objects.count()
        family_members_count = FamilyMember.objects.count()

        self.stdout.write(
            self.style.WARNING(
                f'\n=== FAMILY DATA DELETION COMMAND ===\n'
                f'This will delete ALL family data from the database:\n'
                f'- Family Groups: {family_groups_count}\n'
                f'- Family Relationships: {family_relationships_count}\n'
                f'- Family Members: {family_members_count}\n'
                f'=====================================\n'
            )
        )

        if dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f'DRY RUN: Would delete {family_groups_count} family groups, '
                    f'{family_relationships_count} relationships, and '
                    f'{family_members_count} family members.'
                )
            )
            return

        if not force:
            confirm = input(
                self.style.ERROR(
                    'Are you absolutely sure you want to delete ALL family data? '
                    'This action cannot be undone! Type "DELETE ALL FAMILY DATA" to confirm: '
                )
            )
            
            if confirm != "DELETE ALL FAMILY DATA":
                self.stdout.write(
                    self.style.SUCCESS('Operation cancelled. No data was deleted.')
                )
                return

        try:
            with transaction.atomic():
                # Delete in reverse order to respect foreign key constraints
                self.stdout.write('Deleting family relationships...')
                deleted_relationships = FamilyRelationship.objects.all().delete()
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Deleted {deleted_relationships[0]} family relationships'
                    )
                )

                self.stdout.write('Deleting family members...')
                deleted_members = FamilyMember.objects.all().delete()
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Deleted {deleted_members[0]} family members'
                    )
                )

                self.stdout.write('Deleting family groups...')
                deleted_groups = FamilyGroup.objects.all().delete()
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Deleted {deleted_groups[0]} family groups'
                    )
                )

                # Log the deletion
                logger.warning(
                    f'All family data deleted via management command: '
                    f'{deleted_groups[0]} groups, {deleted_members[0]} members, '
                    f'{deleted_relationships[0]} relationships'
                )

                self.stdout.write(
                    self.style.SUCCESS(
                        f'\n=== DELETION COMPLETE ===\n'
                        f'Successfully deleted all family data:\n'
                        f'- Family Groups: {deleted_groups[0]}\n'
                        f'- Family Members: {deleted_members[0]}\n'
                        f'- Family Relationships: {deleted_relationships[0]}\n'
                        f'========================\n'
                    )
                )

        except Exception as e:
            logger.error(f'Error deleting family data: {str(e)}')
            raise CommandError(f'Failed to delete family data: {str(e)}')

        # Verify deletion
        remaining_groups = FamilyGroup.objects.count()
        remaining_relationships = FamilyRelationship.objects.count()
        remaining_members = FamilyMember.objects.count()

        if remaining_groups == 0 and remaining_relationships == 0 and remaining_members == 0:
            self.stdout.write(
                self.style.SUCCESS(
                    'Verification: All family data has been successfully deleted.'
                )
            )
        else:
            self.stdout.write(
                self.style.ERROR(
                    f'Warning: Some data may remain - '
                    f'Groups: {remaining_groups}, '
                    f'Members: {remaining_members}, '
                    f'Relationships: {remaining_relationships}'
                )
            )
