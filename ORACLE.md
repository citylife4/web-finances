# Oracle Autonomous Database Setup Guide

This guide explains how to configure the Finance Tracker application to use Oracle Autonomous Database instead of MongoDB.

## Prerequisites

1. **Oracle Autonomous Database Instance**
   - Create an Oracle Autonomous Database instance in Oracle Cloud Infrastructure (OCI)
   - Download the wallet files (Wallet_DatabaseName.zip)
   - Note the connection string, username, and password

2. **Oracle Instant Client**
   - Install Oracle Instant Client on your system
   - Ensure the client libraries are in your system PATH

## Configuration Steps

### 1. Environment Variables

Update your environment file (`.env`, `.env.development`, or `.env.production`) with Oracle configuration:

```bash
# Database Configuration
DB_TYPE=oracle

# Oracle Database Configuration
ORACLE_USER=ADMIN
ORACLE_PASSWORD=your-oracle-password
ORACLE_CONNECTION_STRING=your-oracle-connection-string
ORACLE_WALLET_LOCATION=/path/to/wallet
ORACLE_WALLET_PASSWORD=wallet-password
```

### 2. Connection String Format

For Oracle Autonomous Database, the connection string typically looks like:
```
dbname_high?TNS_ADMIN=/path/to/wallet
```

Example:
```
ORACLE_CONNECTION_STRING=mydb_high?TNS_ADMIN=/opt/oracle/wallet
```

### 3. Wallet Configuration

1. Extract the downloaded wallet ZIP file to a secure location
2. Set `ORACLE_WALLET_LOCATION` to the directory containing the wallet files
3. Set `ORACLE_WALLET_PASSWORD` to the wallet password you created

### 4. Database Initialization

Run the Oracle initialization script to create the required tables:

```sql
-- Connect to your Oracle database and run:
@oracle-init/init.sql
```

Or execute the script manually using SQL Developer, SQL*Plus, or your preferred Oracle client.

## Docker Configuration (Optional)

For Docker deployments with Oracle, you'll need to:

1. Mount the Oracle wallet directory as a volume
2. Install Oracle Instant Client in the container
3. Set the appropriate environment variables

Example Docker compose service:
```yaml
backend:
  build:
    context: ./backend
    dockerfile: Dockerfile.oracle  # You would need to create this
  environment:
    DB_TYPE: oracle
    ORACLE_USER: ADMIN
    ORACLE_PASSWORD: your-password
    ORACLE_CONNECTION_STRING: mydb_high
    ORACLE_WALLET_LOCATION: /app/wallet
    ORACLE_WALLET_PASSWORD: wallet-password
  volumes:
    - ./oracle-wallet:/app/wallet:ro
```

## Data Migration

If you're migrating from MongoDB to Oracle:

1. Export your MongoDB data
2. Transform the data to match Oracle schema
3. Import into Oracle using the provided table structure

## Troubleshooting

### Common Issues

1. **ORA-12170: TNS:Connect timeout occurred**
   - Check your network connectivity to Oracle Cloud
   - Verify firewall settings allow Oracle connections

2. **ORA-12541: TNS:no listener**
   - Verify the connection string is correct
   - Check that the Oracle service is running

3. **DPI-1047: Cannot locate a 64-bit Oracle Client library**
   - Install Oracle Instant Client
   - Ensure client libraries are in your PATH

4. **Wallet-related errors**
   - Verify wallet files are present and readable
   - Check wallet password is correct
   - Ensure TNS_ADMIN points to wallet directory

### Performance Optimization

1. **Indexes**: The initialization script creates optimal indexes for the application
2. **Connection Pooling**: The Oracle adapter uses connection pooling for better performance
3. **Query Optimization**: Queries are optimized for Oracle's SQL engine

## Security Considerations

1. **Wallet Security**: Keep wallet files secure and limit access
2. **Password Management**: Use Oracle Vault or secure environment variables
3. **Network Security**: Use VPN or private endpoints when possible
4. **Least Privilege**: Create dedicated users with minimal required permissions

## Backup and Recovery

1. **Automatic Backups**: Oracle Autonomous Database provides automatic backups
2. **Point-in-Time Recovery**: Available for the retention period
3. **Manual Exports**: Use Data Pump for additional backup options

## Support

For Oracle-specific issues:
1. Check Oracle Cloud Documentation
2. Review Oracle Database logs
3. Contact Oracle Support if needed

For application issues:
1. Check application logs
2. Verify environment configuration
3. Test database connectivity separately