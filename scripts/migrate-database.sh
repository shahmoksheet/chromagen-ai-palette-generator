#!/bin/bash

# Database migration script for production deployments
set -e

# Configuration
MIGRATION_TIMEOUT=300  # 5 minutes
BACKUP_BEFORE_MIGRATION=true

# Function to create pre-migration backup
create_backup() {
    if [ "$BACKUP_BEFORE_MIGRATION" = true ]; then
        echo "Creating pre-migration backup..."
        BACKUP_FILE="pre_migration_backup_$(date +"%Y%m%d_%H%M%S").sql"
        
        PGPASSWORD=${POSTGRES_PASSWORD} pg_dump \
            -h ${POSTGRES_HOST:-db} \
            -U ${POSTGRES_USER} \
            -d ${POSTGRES_DB} \
            > /backups/${BACKUP_FILE}
        
        gzip /backups/${BACKUP_FILE}
        echo "Pre-migration backup created: ${BACKUP_FILE}.gz"
    fi
}

# Function to run Prisma migrations
run_migrations() {
    echo "Running database migrations..."
    
    # Generate Prisma client
    npx prisma generate
    
    # Run migrations with timeout
    timeout ${MIGRATION_TIMEOUT} npx prisma migrate deploy
    
    echo "Migrations completed successfully"
}

# Function to verify migration
verify_migration() {
    echo "Verifying migration status..."
    
    # Check migration status
    npx prisma migrate status
    
    # Run a simple query to verify database connectivity
    PGPASSWORD=${POSTGRES_PASSWORD} psql \
        -h ${POSTGRES_HOST:-db} \
        -U ${POSTGRES_USER} \
        -d ${POSTGRES_DB} \
        -c "SELECT 1;" > /dev/null
    
    echo "Migration verification successful"
}

# Function to rollback on failure
rollback_migration() {
    echo "Migration failed. Attempting rollback..."
    
    if [ "$BACKUP_BEFORE_MIGRATION" = true ]; then
        # Find the latest pre-migration backup
        LATEST_BACKUP=$(ls -t /backups/pre_migration_backup_*.sql.gz | head -n1)
        
        if [ -n "$LATEST_BACKUP" ]; then
            echo "Rolling back to: $(basename $LATEST_BACKUP)"
            
            # Restore from backup
            gunzip -c "$LATEST_BACKUP" | \
            PGPASSWORD=${POSTGRES_PASSWORD} psql \
                -h ${POSTGRES_HOST:-db} \
                -U ${POSTGRES_USER} \
                -d ${POSTGRES_DB} \
                --quiet
            
            echo "Rollback completed"
        else
            echo "No pre-migration backup found for rollback"
        fi
    else
        echo "Backup was disabled, cannot rollback automatically"
    fi
}

# Main execution
main() {
    echo "=== Database Migration Process ==="
    echo "Database: ${POSTGRES_DB}"
    echo "Host: ${POSTGRES_HOST:-db}"
    echo "================================="
    
    # Wait for database to be ready
    echo "Waiting for database to be ready..."
    until PGPASSWORD=${POSTGRES_PASSWORD} pg_isready -h ${POSTGRES_HOST:-db} -U ${POSTGRES_USER} -d ${POSTGRES_DB}; do
        echo "Database is not ready yet. Waiting..."
        sleep 2
    done
    
    echo "Database is ready. Starting migration process..."
    
    # Create backup before migration
    create_backup
    
    # Run migrations with error handling
    if run_migrations; then
        verify_migration
        echo "Migration process completed successfully at $(date)"
    else
        echo "Migration failed at $(date)"
        rollback_migration
        exit 1
    fi
}

main