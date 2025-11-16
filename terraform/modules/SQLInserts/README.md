# SQLInserts Module

This Terraform module automatically initializes AWS RDS databases with SQL scripts using Lambda functions.

## Overview

The module creates a Lambda function that runs inside your VPC to execute SQL initialization scripts on your RDS instances. This provides a production-ready, automated way to initialize databases with schema and seed data.

## Features

- **Automated Initialization**: Automatically runs SQL scripts after RDS creation
- **Secure VPC Connectivity**: Lambda runs inside your VPC to access private RDS instances
- **Idempotent**: Safe to run multiple times (uses `CREATE IF NOT EXISTS` and `ON DUPLICATE KEY`)
- **Multiple Databases**: Supports initializing both primary and secondary databases
- **CloudWatch Logging**: Full logging of initialization process

## Architecture

```
SQL Files → Lambda Package → Lambda Function (in VPC) → RDS Instances
```

1. SQL files are packaged with Lambda deployment
2. Lambda is triggered after RDS creation
3. Lambda connects to RDS through VPC
4. SQL statements are executed sequentially
5. Results are logged to CloudWatch

## Usage

```hcl
module "sql_inserts" {
  source = "./modules/SQLInserts"

  project_name           = "my-project"
  vpc_id                 = module.vpc.vpc_id
  subnet_ids             = module.vpc.private_subnet_ids
  rds_security_group_id  = module.rds.rds_security_group_id

  # Primary database
  primary_db_host        = module.rds.primary_db_address
  primary_db_name        = "my_database"
  primary_sql_file       = "${path.module}/../init-db-primary.sql"

  # Secondary database (optional)
  secondary_db_host      = module.rds.secondary_db_address
  secondary_db_name      = "analytics_db"
  secondary_sql_file     = "${path.module}/../init-db-secondary.sql"

  # Credentials
  db_username            = "admin"
  db_password            = var.db_password

  # Auto-invoke on creation
  auto_invoke            = true
  force_reinvoke         = false
}
```

## Variables

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|----------|
| `project_name` | Project name for resource naming | string | - | yes |
| `vpc_id` | VPC ID where Lambda will run | string | - | yes |
| `subnet_ids` | Subnet IDs for Lambda VPC config | list(string) | - | yes |
| `rds_security_group_id` | Security group ID of RDS instances | string | - | yes |
| `primary_db_host` | Primary database host endpoint | string | - | yes |
| `primary_db_name` | Primary database name | string | - | yes |
| `primary_sql_file` | Path to primary SQL file | string | - | yes |
| `secondary_db_host` | Secondary database host | string | "" | no |
| `secondary_db_name` | Secondary database name | string | "" | no |
| `secondary_sql_file` | Path to secondary SQL file | string | "" | no |
| `db_username` | Database username | string | - | yes |
| `db_password` | Database password | string | - | yes |
| `auto_invoke` | Auto-invoke Lambda after creation | bool | true | no |
| `force_reinvoke` | Force re-invocation | bool | false | no |

## Outputs

| Name | Description |
|------|-------------|
| `lambda_function_name` | Name of the Lambda function |
| `lambda_function_arn` | ARN of the Lambda function |
| `lambda_role_arn` | ARN of the Lambda execution role |
| `lambda_security_group_id` | Security group ID of Lambda |
| `invocation_result` | Result of Lambda invocation |

## SQL File Requirements

SQL files should be idempotent to allow safe re-running:

```sql
-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS my_database;
USE my_database;

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY,
  name VARCHAR(100)
);

-- Use ON DUPLICATE KEY UPDATE for inserts
INSERT INTO users (id, name) VALUES (1, 'Admin')
ON DUPLICATE KEY UPDATE name=name;
```

## Re-running Initialization

To re-run the initialization:

1. Set `force_reinvoke = true` in your module configuration
2. Run `terraform apply`
3. The Lambda will be invoked again with the latest SQL scripts

## Manual Invocation

You can manually invoke the Lambda function:

```bash
aws lambda invoke \
  --function-name <lambda-function-name> \
  --payload '{"action":"initialize"}' \
  response.json
```

## Troubleshooting

### Check Lambda Logs

```bash
aws logs tail /aws/lambda/<lambda-function-name> --follow
```

### Common Issues

1. **Timeout**: Increase Lambda timeout if SQL scripts are large
2. **Connection Error**: Verify security group allows Lambda → RDS traffic
3. **SQL Errors**: Check CloudWatch logs for detailed error messages

## Security Considerations

- Lambda runs in private subnets (no internet access by default)
- RDS remains private (not publicly accessible)
- Database credentials are passed via environment variables
- SQL files should not contain sensitive data (use seed scripts for that)

## Dependencies

The module requires:
- Python 3.11 runtime
- `pymysql` library (installed automatically)
- VPC with private subnets
- RDS instances already created

## Cost Considerations

- Lambda invocations are charged per execution
- Lambda runtime is charged per second
- CloudWatch logs have retention costs
- Consider setting `auto_invoke = false` for development to save costs
