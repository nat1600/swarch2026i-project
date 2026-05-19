# Performance Analysis

Runs load tests against a given URL using [k6](https://k6.io/) and generates a response time curve by concurrent users (VUs).

## Requirements

- [k6](https://k6.io/docs/get-started/installation/)
- Python 3.x
- Python dependencies: `pip install tqdm matplotlib`

## Usage

### 1. Run the load tests

```bash
./run.sh <URL> <VU1> <VU2> ... <VUN>
```

**Example:**
```bash
./run.sh http://192.168.0.12:8081/health 1 10 50 100 200
```

This runs a separate 30-second k6 test for each VU value, with a 15-minute cooldown between runs to let the server recover. Results are saved as JSON files in `results/jsons/`.

### 2. Generate the performance curve

```bash
python3 main.py
```

Reads all JSON result files and generates `results/performance_curve.png` — a plot of average response time (ms) vs. concurrent users.

## Output

```
results/
├── jsons/
│   ├── 1.json
│   ├── 10.json
│   └── ...
└── performance_curve.png
```
