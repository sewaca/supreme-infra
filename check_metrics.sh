#!/bin/bash
echo "Checking if web-profile-ssr is running..."
if lsof -i :3000 > /dev/null 2>&1; then
    echo "✓ Service is running on port 3000"
    
    echo -e "\nChecking metrics endpoint..."
    if curl -s http://localhost:9464/metrics > /dev/null 2>&1; then
        echo "✓ Metrics endpoint is accessible"
        
        echo -e "\nSearching for http_server_duration_count with http_route..."
        curl -s http://localhost:9464/metrics | grep 'http_server_duration_count' | grep 'http_route' | head -5
        
        if [ $? -eq 0 ]; then
            echo -e "\n✓ Found http_route in metrics!"
        else
            echo -e "\n✗ http_route NOT found in metrics"
            echo -e "\nShowing sample http_server_duration_count metrics:"
            curl -s http://localhost:9464/metrics | grep 'http_server_duration_count' | head -5
        fi
    else
        echo "✗ Metrics endpoint not accessible on port 9464"
    fi
else
    echo "✗ Service not running on port 3000"
fi
