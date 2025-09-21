#!/bin/bash

# Database backup script for production
set -e

# Configuration
BACKUP_DIR="/backups"
RETENTION_DAYS=30
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="chromagen_backup_${TIMESTAMP}.sql"

# Create backup directory if it doesn't exist
mkdir -p ${BACKUP_DIR}

# Function to perform backup
perform_backup() {
    echo "Starting database backup at $(date)"
    
    # Create database dump
    PGPASSWORD=${POSTGRES_PASSWORD} pg_dump \
        -h ${POSTGRES_HOST} \
        -U ${POSTGRES_USER} \
        -d ${POSTGRES_DB} \
        --verbose \
        --clean \
        --no-owner \
        --no-privileges \
        > ${BACKUP_DIR}/${BACKUP_FILE}
    
    # Compress backup
    gzip ${BACKUP_DIR}/${BACKUP_FILE}
    
    echo "Backup completed: ${BACKUP_FILE}.gz"
}

# Function to cleanup old backups
cleanup_old_backups() {
    echo "Cleaning up backups older than ${RETENTION_DAYS} days"
    find ${BACKUP_DIR} -name "chromagen_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
    echo "Cleanup completed"
}

# Function to verify backup
verify_backup() {
    local backup_file="${BACKUP_DIR}/${BACKUP_FILE}.gz"
    
    if [ -f "$backup_file" ]; then
        local file_size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file" 2>/dev/null)
        if [ "$file_size" -gt 1000 ]; then
            echo "Backup verification successful: ${backup_file} (${file_size} bytes)"
            return 0
        else
            echo "Backup verification failed: file too small"
            return 1
        fi
    else
        echo "Backup verification failed: file not found"
        return 1
    fi
}

# Main execution
main() {
    perform_backup
    
    if verify_backup; then
        cleanup_old_backups
        echo "Backup process completed successfully at $(date)"
    else
        echo "Backup process failed at $(date)"
        exit 1
    fi
}

# Run backup every 6 hours
while true; do
    main
    sleep 21600  # 6 hours
done