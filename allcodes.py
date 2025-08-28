import os

# Get the current directory (project directory)
project_dir = os.path.dirname(os.path.abspath(__file__))

# Set the output file path
output_file = os.path.join(project_dir, 'all_codes.txt')

# Define the file extensions to include for this React/Django project
extensions = ('.py', '.tsx', '.ts', '.js', '.jsx', '.css', '.html', '.md', '.txt')

# Define the directories to exclude
exclude_dirs = (
    '__pycache__', '.git', '.venv', 'venv', 'env', 'migrations',
    'plans', 'media', 'static', 'templates', 'node_modules',
    'htmlcov', '.pytest_cache', 'build', 'dist', 'coverage'
)

# Define the file name prefixes to exclude
exclude_prefixes = ('old', os.path.basename(output_file))

# Define specific files to exclude
exclude_files = (
    'all_codes.txt', 'app.db', 'db.sqlite3', '.coverage', 'coverage.xml',
    'package-lock.json', 'yarn.lock'
)

def copy_codes_to_file(project_dir, output_file):
    # Check if the output file exists and delete it
    if os.path.exists(output_file):
        os.remove(output_file)

    with open(output_file, 'w', encoding='utf-8') as f:
        # Write project header
        f.write('DIRECTORY REACT FINAL PROJECT - COMPLETE SOURCE CODE\n')
        f.write('=' * 60 + '\n\n')
        f.write(f'Generated on: {os.popen("date").read().strip()}\n')
        f.write(f'Project root: {project_dir}\n\n')
        f.write('=' * 60 + '\n\n')

        for root, dirs, files in os.walk(project_dir):
            # Exclude directories from the walk
            dirs[:] = [d for d in dirs if d not in exclude_dirs]

            for file in files:
                # Skip excluded files
                if file in exclude_files:
                    continue
                    
                if file.startswith(exclude_prefixes):
                    continue
                    
                if not file.endswith(extensions):
                    continue

                file_path = os.path.join(root, file)
                module_name = os.path.relpath(file_path, project_dir).replace(os.path.sep, '/')

                # Skip the current script file
                script_file = os.path.basename(__file__)
                if file == script_file:
                    continue

                # Write file header
                underline = '=' * len(module_name)
                f.write(f'{module_name}\n{underline}\n\n')

                try:
                    with open(file_path, 'r', encoding='utf-8') as code_file:
                        code = code_file.read()
                        f.write(code)
                        f.write('\n\n')
                except UnicodeDecodeError:
                    # Handle binary files gracefully
                    f.write(f'[BINARY FILE - Cannot display content]\n\n')
                except Exception as e:
                    # Handle other errors gracefully
                    f.write(f'[ERROR READING FILE: {str(e)}]\n\n')

        # Write footer
        f.write('=' * 60 + '\n')
        f.write('END OF PROJECT SOURCE CODE\n')
        f.write('=' * 60 + '\n')

# Call the function
if __name__ == "__main__":
    copy_codes_to_file(project_dir, output_file)
    print(f'All codes have been copied to {output_file}')
    print(f'Total project size: {len(os.listdir(project_dir))} items processed')