#!/usr/bin/env python3
# 2025-01-27: Gender field update script for family tree functionality
# Updates empty gender fields based on exact name matches with existing gender data

import os
import sys
import django
from django.db import transaction
from django.db.models import Q
import logging
from typing import Dict, List, Tuple

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dirfinal.settings')
django.setup()

from dirReactFinal_directory.models import PhoneBookEntry

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('gender_update.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class GenderFieldUpdater:
    """Updates gender fields based on exact name matches"""
    
    def __init__(self):
        self.update_stats = {
            'total_entries': 0,
            'entries_with_gender': 0,
            'entries_without_gender': 0,
            'exact_matches_found': 0,
            'gender_updates_applied': 0,
            'errors': []
        }
        
    def analyze_gender_fields(self) -> Dict[str, int]:
        """Analyze current state of gender fields in the database"""
        logger.info("Analyzing gender fields in database...")
        
        try:
            # Get total count
            total_entries = PhoneBookEntry.objects.count()
            
            # Count entries with gender data
            entries_with_gender = PhoneBookEntry.objects.exclude(
                Q(gender__isnull=True) | Q(gender__exact='')
            ).count()
            
            # Count entries without gender data
            entries_without_gender = PhoneBookEntry.objects.filter(
                Q(gender__isnull=True) | Q(gender__exact='')
            ).count()
            
            # Count by gender type
            male_count = PhoneBookEntry.objects.filter(
                Q(gender__icontains='m') | Q(gender__icontains='male')
            ).exclude(
                Q(gender__icontains='f') | Q(gender__icontains='female')
            ).count()
            
            female_count = PhoneBookEntry.objects.filter(
                Q(gender__icontains='f') | Q(gender__icontains='female')
            ).exclude(
                Q(gender__icontains='m') | Q(gender__icontains='male')
            ).count()
            
            # Count entries with unclear gender data
            unclear_count = PhoneBookEntry.objects.filter(
                Q(gender__icontains='m') & Q(gender__icontains='f')
            ).count()
            
            analysis = {
                'total_entries': total_entries,
                'entries_with_gender': entries_with_gender,
                'entries_without_gender': entries_without_gender,
                'male_count': male_count,
                'female_count': female_count,
                'unclear_count': unclear_count
            }
            
            logger.info(f"Gender field analysis completed:")
            logger.info(f"  Total entries: {total_entries}")
            logger.info(f"  With gender: {entries_with_gender}")
            logger.info(f"  Without gender: {entries_without_gender}")
            logger.info(f"  Male: {male_count}")
            logger.info(f"  Female: {female_count}")
            logger.info(f"  Unclear: {unclear_count}")
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing gender fields: {e}")
            self.update_stats['errors'].append(f"Analysis error: {e}")
            return {}
    
    def find_exact_name_matches(self) -> List[Tuple[PhoneBookEntry, PhoneBookEntry]]:
        """Find entries with exact names where one has gender and the other doesn't"""
        logger.info("Finding exact name matches for gender updates...")
        
        matches = []
        
        try:
            # Get all entries without gender
            entries_without_gender = PhoneBookEntry.objects.filter(
                Q(gender__isnull=True) | Q(gender__exact='')
            )
            
            # Get all entries with gender
            entries_with_gender = PhoneBookEntry.objects.exclude(
                Q(gender__isnull=True) | Q(gender__exact='')
            )
            
            logger.info(f"Found {entries_without_gender.count()} entries without gender")
            logger.info(f"Found {entries_with_gender.count()} entries with gender")
            
            # Find exact name matches
            for entry_without in entries_without_gender:
                # Look for exact name matches with gender data
                exact_matches = entries_with_gender.filter(name__exact=entry_without.name)
                
                for match in exact_matches:
                    # Verify the match has valid gender data
                    if self.is_valid_gender(match.gender):
                        matches.append((entry_without, match))
                        break  # Use first valid match
            
            logger.info(f"Found {len(matches)} exact name matches for gender updates")
            return matches
            
        except Exception as e:
            logger.error(f"Error finding exact name matches: {e}")
            self.update_stats['errors'].append(f"Match finding error: {e}")
            return []
    
    def is_valid_gender(self, gender: str) -> bool:
        """Check if gender field contains valid gender information"""
        if not gender:
            return False
        
        gender_lower = gender.lower().strip()
        
        # Check for male indicators
        male_indicators = ['m', 'male', 'm.']
        # Check for female indicators  
        female_indicators = ['f', 'female', 'f.']
        
        # Check if it's clearly male or female (not both)
        is_male = any(indicator in gender_lower for indicator in male_indicators)
        is_female = any(indicator in gender_lower for indicator in female_indicators)
        
        # Return True if it's clearly one gender (not both, not unclear)
        return (is_male and not is_female) or (is_female and not is_male)
    
    def normalize_gender(self, gender: str) -> str:
        """Normalize gender field to standard format (M or F)"""
        if not gender:
            return ''
        
        gender_lower = gender.lower().strip()
        
        # Check for male indicators
        male_indicators = ['m', 'male', 'm.']
        # Check for female indicators
        female_indicators = ['f', 'female', 'f.']
        
        if any(indicator in gender_lower for indicator in male_indicators):
            return 'M'
        elif any(indicator in gender_lower for indicator in female_indicators):
            return 'F'
        else:
            return gender  # Keep original if unclear
    
    def update_gender_fields(self, matches: List[Tuple[PhoneBookEntry, PhoneBookEntry]]) -> bool:
        """Update gender fields based on exact name matches"""
        logger.info(f"Starting gender field updates for {len(matches)} matches...")
        
        try:
            with transaction.atomic():
                updates_applied = 0
                
                for entry_without, entry_with in matches:
                    try:
                        # Normalize the gender from the source entry
                        normalized_gender = self.normalize_gender(entry_with.gender)
                        
                        if normalized_gender in ['M', 'F']:
                            # Update the entry without gender
                            entry_without.gender = normalized_gender
                            entry_without.save(update_fields=['gender'])
                            updates_applied += 1
                            
                            logger.info(f"Updated {entry_without.name} (PID: {entry_without.pid}) "
                                      f"with gender: {normalized_gender} "
                                      f"(from match with PID: {entry_with.pid})")
                        else:
                            logger.warning(f"Skipping {entry_with.name} - unclear gender: {entry_with.gender}")
                            
                    except Exception as e:
                        logger.error(f"Error updating entry {entry_without.pid}: {e}")
                        self.update_stats['errors'].append(f"Update error for PID {entry_without.pid}: {e}")
                
                logger.info(f"Successfully applied {updates_applied} gender updates")
                self.update_stats['gender_updates_applied'] = updates_applied
                return True
                
        except Exception as e:
            logger.error(f"Transaction failed during gender updates: {e}")
            self.update_stats['errors'].append(f"Transaction error: {e}")
            return False
    
    def run_gender_analysis(self) -> Dict[str, any]:
        """Run complete gender field analysis and update process"""
        logger.info("Starting gender field analysis and update process...")
        
        try:
            # Step 1: Analyze current state
            analysis = self.analyze_gender_fields()
            if not analysis:
                return {'success': False, 'error': 'Analysis failed'}
            
            # Step 2: Find exact name matches
            matches = self.find_exact_name_matches()
            if not matches:
                logger.info("No exact name matches found for gender updates")
                return {'success': True, 'analysis': analysis, 'updates_applied': 0}
            
            # Step 3: Update gender fields
            update_success = self.update_gender_fields(matches)
            if not update_success:
                return {'success': False, 'error': 'Gender updates failed'}
            
            # Step 4: Final analysis
            final_analysis = self.analyze_gender_fields()
            
            result = {
                'success': True,
                'initial_analysis': analysis,
                'final_analysis': final_analysis,
                'matches_found': len(matches),
                'updates_applied': self.update_stats['gender_updates_applied'],
                'errors': self.update_stats['errors']
            }
            
            logger.info("Gender field analysis and update process completed successfully")
            return result
            
        except Exception as e:
            logger.error(f"Gender analysis process failed: {e}")
            return {'success': False, 'error': str(e)}
    
    def generate_report(self, result: Dict[str, any]) -> str:
        """Generate a human-readable report of the gender update process"""
        if not result.get('success'):
            return f"Gender update process failed: {result.get('error', 'Unknown error')}"
        
        report = []
        report.append("=" * 60)
        report.append("GENDER FIELD UPDATE REPORT")
        report.append("=" * 60)
        report.append("")
        
        # Initial state
        initial = result['initial_analysis']
        report.append("INITIAL STATE:")
        report.append(f"  Total entries: {initial['total_entries']:,}")
        report.append(f"  With gender: {initial['entries_with_gender']:,}")
        report.append(f"  Without gender: {initial['entries_without_gender']:,}")
        report.append(f"  Male: {initial['male_count']:,}")
        report.append(f"  Female: {initial['female_count']:,}")
        report.append("")
        
        # Update results
        report.append("UPDATE RESULTS:")
        report.append(f"  Exact name matches found: {result['matches_found']:,}")
        report.append(f"  Gender updates applied: {result['updates_applied']:,}")
        report.append("")
        
        # Final state
        final = result['final_analysis']
        report.append("FINAL STATE:")
        report.append(f"  Total entries: {final['total_entries']:,}")
        report.append(f"  With gender: {final['entries_with_gender']:,}")
        report.append(f"  Without gender: {final['entries_without_gender']:,}")
        report.append(f"  Male: {final['male_count']:,}")
        report.append(f"  Female: {final['female_count']:,}")
        report.append("")
        
        # Improvement
        improvement = initial['entries_without_gender'] - final['entries_without_gender']
        if improvement > 0:
            report.append(f"IMPROVEMENT: {improvement:,} more entries now have gender data")
        else:
            report.append("No improvement in gender data coverage")
        
        # Errors
        if result['errors']:
            report.append("")
            report.append("ERRORS ENCOUNTERED:")
            for error in result['errors']:
                report.append(f"  - {error}")
        
        report.append("")
        report.append("=" * 60)
        
        return "\n".join(report)

def main():
    """Main execution function"""
    logger.info("Starting gender field update script...")
    
    try:
        # Create updater instance
        updater = GenderFieldUpdater()
        
        # Run the complete process
        result = updater.run_gender_analysis()
        
        # Generate and display report
        report = updater.generate_report(result)
        print(report)
        
        # Save report to file
        with open('gender_update_report.txt', 'w', encoding='utf-8') as f:
            f.write(report)
        
        logger.info("Gender update script completed. Report saved to gender_update_report.txt")
        
        if result.get('success'):
            return 0
        else:
            return 1
            
    except Exception as e:
        logger.error(f"Script execution failed: {e}")
        print(f"Script execution failed: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
