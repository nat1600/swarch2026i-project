#!/bin/bash

if ! command -v k6 &> /dev/null; then
    echo "k6 is not installed"
    exit 1
fi

mkdir -p results/jsons

URL=$1
shift

echo "Running with URL: $URL..."

for vus in "$@"; do
    echo "Running with $vus VUs..."
    k6 run -e VUS=$vus -e URL=$URL --summary-export=results/jsons/"${vus}.json" --log-output=none performance_test.js
    echo "Finished $vus VUs. Resting 15 minutes"
    sleep 900
done
