import json
import os
import pymysql
import boto3

def lambda_handler(event, context):
    """
    Lambda function to initialize RDS databases with SQL scripts
    """
    print("Starting database initialization...")

    results = {
        'primary': {'status': 'pending', 'message': ''},
        'secondary': {'status': 'pending', 'message': ''}
    }

    # Get environment variables
    primary_host = os.environ.get('PRIMARY_DB_HOST')
    primary_name = os.environ.get('PRIMARY_DB_NAME')
    secondary_host = os.environ.get('SECONDARY_DB_HOST')
    secondary_name = os.environ.get('SECONDARY_DB_NAME')
    db_username = os.environ.get('DB_USERNAME')
    db_password = os.environ.get('DB_PASSWORD')

    # Initialize primary database
    if primary_host:
        try:
            print(f"Connecting to primary database: {primary_host}")
            results['primary'] = execute_sql_file(
                host=primary_host,
                username=db_username,
                password=db_password,
                database=primary_name,
                sql_file='init-db-primary.sql'
            )
        except Exception as e:
            results['primary'] = {
                'status': 'error',
                'message': f"Failed to initialize primary database: {str(e)}"
            }
            print(f"Primary DB Error: {str(e)}")

    # Initialize secondary database
    if secondary_host:
        try:
            print(f"Connecting to secondary database: {secondary_host}")
            results['secondary'] = execute_sql_file(
                host=secondary_host,
                username=db_username,
                password=db_password,
                database=secondary_name,
                sql_file='init-db-secondary.sql'
            )
        except Exception as e:
            results['secondary'] = {
                'status': 'error',
                'message': f"Failed to initialize secondary database: {str(e)}"
            }
            print(f"Secondary DB Error: {str(e)}")

    # Determine overall success
    all_success = all(
        r['status'] == 'success'
        for r in results.values()
        if r['status'] != 'pending'
    )

    return {
        'statusCode': 200 if all_success else 500,
        'body': json.dumps(results, indent=2)
    }


def execute_sql_file(host, username, password, database, sql_file):
    """
    Execute SQL file on the specified database
    """
    try:
        # Read SQL file
        sql_file_path = os.path.join('/opt', sql_file)
        if not os.path.exists(sql_file_path):
            sql_file_path = os.path.join(os.path.dirname(__file__), sql_file)

        print(f"Reading SQL file: {sql_file_path}")
        with open(sql_file_path, 'r') as f:
            sql_content = f.read()

        # Connect to database
        print(f"Connecting to MySQL at {host}...")
        connection = pymysql.connect(
            host=host,
            user=username,
            password=password,
            database=None,  # Connect without database first
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor,
            connect_timeout=30
        )

        try:
            with connection.cursor() as cursor:
                # Split SQL content into individual statements
                statements = split_sql_statements(sql_content)

                print(f"Executing {len(statements)} SQL statements...")
                executed = 0

                for statement in statements:
                    if statement.strip():
                        try:
                            cursor.execute(statement)
                            executed += 1
                        except pymysql.err.OperationalError as e:
                            # Ignore "database exists" and "table exists" errors
                            if "already exists" in str(e).lower():
                                print(f"Skipping existing object: {str(e)}")
                                continue
                            raise

                connection.commit()
                print(f"Successfully executed {executed} statements")

                return {
                    'status': 'success',
                    'message': f'Executed {executed} SQL statements successfully',
                    'statements_executed': executed
                }

        finally:
            connection.close()

    except FileNotFoundError as e:
        return {
            'status': 'error',
            'message': f'SQL file not found: {sql_file}'
        }
    except pymysql.Error as e:
        return {
            'status': 'error',
            'message': f'Database error: {str(e)}'
        }
    except Exception as e:
        return {
            'status': 'error',
            'message': f'Unexpected error: {str(e)}'
        }


def split_sql_statements(sql_content):
    """
    Split SQL content into individual statements
    Handles multi-line statements and comments
    """
    statements = []
    current_statement = []
    in_delimiter = False

    for line in sql_content.split('\n'):
        # Skip empty lines and comments
        stripped = line.strip()
        if not stripped or stripped.startswith('--'):
            continue

        current_statement.append(line)

        # Check if line ends with semicolon (statement terminator)
        if stripped.endswith(';'):
            statements.append('\n'.join(current_statement))
            current_statement = []

    # Add any remaining statement
    if current_statement:
        statements.append('\n'.join(current_statement))

    return statements
