#!/bin/bash

# Database restore script for production
set -e

# Configuration
BACKUP_DIR="/backups"
RESTORE_FILE=$1

# Validate input
if [ -z "$RESTORE_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    echo "Available backups:"
    ls -la ${BACKUP_DIR}/chromagen_backup_*.sql.gz
    exit 1
fi

# Check if backup file exists
if [ ! -f "${BACKUP_DIR}/${RESTORE_FILE}" ]; then
    echo "Error: Backup file ${RESTORE_FILE} not found in ${BACKUP_DIR}"
    exit 1
fi

# Function to restore database
restore_database() {
    echo "Starting database restore from ${RESTORE_FILE} at $(date)"
    
    # Create a backup of current database before restore
    CURRENT_BACKUP="pre_restore_backup_$(date +"%Y%m%d_%H%M%S").sql"
    echo "Creating backup of current database: ${CURRENT_BACKUP}"
    
    PGPASSWORD=${POSTGRES_PASSWORD} pg_dump \
        -h ${POSTGRES_HOST} \
        -U ${POSTGRES_USER} \
        -d ${POSTGRES_DB} \
        > ${BACKUP_DIR}/${CURRENT_BACKUP}
    
    gzip ${BACKUP_DIR}/${CURRENT_BACKUP}
    
    # Restore from backup
    echo "Restoring database from ${RESTORE_FILE}"
    
    # Decompress and restore
    gunzip -c ${BACKUP_DIR}/${RESTORE_FILE} | \
    PGPASSWORD=${POSTGRES_PASSWORD} psql \
        -h ${POSTGRES_HOST} \
        -U ${POSTGRES_USER} \
        -d ${POSTGRES_DB} \
        --quiet
    
    echo "Database restore completed at $(date)"
}

# Function to verify restore
verify_restore() {
    echo "Verifying database restore..."
    
    # Check if tables exist
    TABLE_COUNT=$(PGPASSWORD=${POSTGRES_PASSWORD} psql \
        -h ${POSTGRES_HOST} \
        -U ${POSTGRES_USER} \
        -d ${POSTGRES_DB} \
        -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
    
    if [ "$TABLE_COUNT" -gt 0 ]; then
        echo "Restore verification successful: ${TABLE_COUNT} tables found"
        return 0
    else
        echo "Restore verification failed: no tables found"
        return 1
    fi
}

# Main execution
main() {
    echo "=== Database Restore Process ==="
    echo "Backup file: ${RESTORE_FILE}"
    echo "Target database: ${POSTGRES_DB}"
    echo "================================"
    
    read -p "Are you sure you want to restore? This will overwrite the current database. (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        restore_database
        
        if verify_restore; then
            echo "Restore process completed successfully"
        else
            echo "Restore process failed verification"
            exit 1
        fi
    else
        echo "Restore cancelled"
        exit 0
    fi
}

main