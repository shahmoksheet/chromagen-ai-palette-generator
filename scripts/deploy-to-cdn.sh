#!/bin/bash

# CDN deployment script for static assets
set -e

# Configuration
CDN_BUCKET=${CDN_BUCKET:-"chromagen-static-assets"}
CDN_REGION=${CDN_REGION:-"us-east-1"}
CLOUDFRONT_DISTRIBUTION_ID=${CLOUDFRONT_DISTRIBUTION_ID}
BUILD_DIR="frontend/dist"
CACHE_CONTROL_LONG="public, max-age=31536000, immutable"
CACHE_CONTROL_SHORT="public, max-age=300"

# Function to check if AWS CLI is installed
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        echo "Error: AWS CLI is not installed"
        echo "Please install AWS CLI: https://aws.amazon.com/cli/"
        exit 1
    fi
}

# Function to build frontend assets
build_assets() {
    echo "Building frontend assets..."
    cd frontend
    npm run build
    cd ..
    echo "Build completed"
}

# Function to optimize assets
optimize_assets() {
    echo "Optimizing assets..."
    
    # Compress images
    find ${BUILD_DIR} -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" | while read img; do
        if command -v imagemin &> /dev/null; then
            imagemin "$img" --out-dir="$(dirname "$img")"
        fi
    done
    
    # Gzip compress text files
    find ${BUILD_DIR} -name "*.js" -o -name "*.css" -o -name "*.html" -o -name "*.json" | while read file; do
        gzip -9 -c "$file" > "$file.gz"
    done
    
    echo "Asset optimization completed"
}

# Function to sync assets to S3
sync_to_s3() {
    echo "Syncing assets to S3..."
    
    # Sync HTML files with short cache
    aws s3 sync ${BUILD_DIR} s3://${CDN_BUCKET}/ \
        --exclude "*" \
        --include "*.html" \
        --cache-control "${CACHE_CONTROL_SHORT}" \
        --content-encoding gzip \
        --delete
    
    # Sync CSS and JS files with long cache
    aws s3 sync ${BUILD_DIR} s3://${CDN_BUCKET}/ \
        --exclude "*" \
        --include "*.css" \
        --include "*.js" \
        --cache-control "${CACHE_CONTROL_LONG}" \
        --content-encoding gzip \
        --delete
    
    # Sync other assets
    aws s3 sync ${BUILD_DIR} s3://${CDN_BUCKET}/ \
        --exclude "*.html" \
        --exclude "*.css" \
        --exclude "*.js" \
        --exclude "*.gz" \
        --cache-control "${CACHE_CONTROL_LONG}" \
        --delete
    
    echo "S3 sync completed"
}

# Function to invalidate CloudFront cache
invalidate_cloudfront() {
    if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
        echo "Invalidating CloudFront cache..."
        
        aws cloudfront create-invalidation \
            --distribution-id ${CLOUDFRONT_DISTRIBUTION_ID} \
            --paths "/*"
        
        echo "CloudFront invalidation initiated"
    else
        echo "CloudFront distribution ID not set, skipping invalidation"
    fi
}

# Function to verify deployment
verify_deployment() {
    echo "Verifying deployment..."
    
    # Check if index.html is accessible
    if [ -n "$CDN_URL" ]; then
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${CDN_URL}/index.html")
        
        if [ "$HTTP_STATUS" = "200" ]; then
            echo "Deployment verification successful"
        else
            echo "Deployment verification failed: HTTP $HTTP_STATUS"
            exit 1
        fi
    else
        echo "CDN_URL not set, skipping verification"
    fi
}

# Function to generate asset manifest
generate_manifest() {
    echo "Generating asset manifest..."
    
    MANIFEST_FILE="${BUILD_DIR}/asset-manifest.json"
    
    cat > ${MANIFEST_FILE} << EOF
{
  "version": "$(date +%s)",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "files": {
EOF

    # List all files with their hashes
    find ${BUILD_DIR} -type f -not -name "asset-manifest.json" | while read file; do
        relative_path=${file#${BUILD_DIR}/}
        file_hash=$(sha256sum "$file" | cut -d' ' -f1)
        echo "    \"${relative_path}\": \"${file_hash}\"," >> ${MANIFEST_FILE}
    done
    
    # Remove trailing comma and close JSON
    sed -i '$ s/,$//' ${MANIFEST_FILE}
    echo "  }" >> ${MANIFEST_FILE}
    echo "}" >> ${MANIFEST_FILE}
    
    echo "Asset manifest generated"
}

# Main execution
main() {
    echo "=== CDN Deployment Process ==="
    echo "Bucket: ${CDN_BUCKET}"
    echo "Region: ${CDN_REGION}"
    echo "Build Directory: ${BUILD_DIR}"
    echo "================================"
    
    check_aws_cli
    build_assets
    optimize_assets
    generate_manifest
    sync_to_s3
    invalidate_cloudfront
    verify_deployment
    
    echo "CDN deployment completed successfully at $(date)"
}

main