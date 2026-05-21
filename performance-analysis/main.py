import json
from pathlib import Path

from tqdm import tqdm
import matplotlib.pyplot as plt


def main() -> None:
    # Check dir
    results_dir: Path = Path("results")
    if not results_dir.exists():
        print("Error: 'results/' directory not found. Run './run.sh <URL> <VUs>' first.")
        return

    # Get json files
    json_files: dict[int, dict] = {}
    json_files_dir: Path = results_dir / "jsons"
    if not json_files_dir.exists():
        print("Error: 'results/jsons' directory not found. Run './run.sh <URL> <VUs>' first.")
        return

    results_files = list(json_files_dir.iterdir())
    for file in tqdm(results_files, "Getting json files"):
        if file.suffix != '.json':
            continue
        if not file.stem.isdecimal():
            print(f"Omitting file {file} since its number is not a digit")
            continue
        with open(file, mode='r', encoding="utf-8") as infile:
            data = json.load(infile)
        json_files[int(file.stem)] =  data
    if len(json_files) == 0:
        print(
            f"No valid result files found in '{json_files_dir}'. Check that run.sh "
            f"completed successfully."
        )
        return

    # Parse results
    data: dict[int, tuple[float, float]] = {}
    for vus, result in tqdm(json_files.items(), "Extracting data from the json files"):
        if "metrics" not in result:
            print(f"  [!] Skipping VUs={vus}: missing 'metrics' key")
            continue
        if "http_req_duration" not in result["metrics"]:
            print(f"  [!] Skipping VUs={vus}: missing 'http_req_duration' in metrics")
            continue
        if "avg" not in result["metrics"]["http_req_duration"]:
            print(f"  [!] Skipping VUs={vus}: missing 'avg' in http_req_duration")
            continue
        if "http_req_failed" not in result['metrics']:
            print(f"  [!] Skipping VUs={vus}: missing 'http_req_failed' in metrics")
            continue
        if "value" not in result['metrics']['http_req_failed']:
            print(f"  [!] Skipping VUs={vus}: missing 'value' in http_req_failed")
            continue
        data[vus] = (
            float(result["metrics"]["http_req_duration"]["avg"]),
            float(result["metrics"]["http_req_failed"]["value"]) * 100
        )
    if not data:
        print("No data could be extracted from results. All VU runs were skipped.")
        return

    # Sort by VUs
    sorted_data = sorted(data.items())
    vus_list = [item[0] for item in sorted_data]
    avg_durations = [item[1][0] for item in sorted_data]
    error_rates = [item[1][1] for item in sorted_data]

    # Plot
    plt.figure(figsize=(10, 6))
    plt.plot(vus_list, avg_durations, marker="o", linewidth=2.5, markersize=8)

    # Annotate each dot with error %
    for vu, dur, err in zip(vus_list, avg_durations, error_rates):
        plt.annotate(
            f"{err:.2f}%",
            xy=(vu, dur),
            textcoords="offset points",
            xytext=(0, 10),
            ha="center", fontsize=8, color="#dc2626", fontweight="bold",
        )

    plt.xlabel("Concurrent Users (VUs)")
    plt.ylabel("Avg Response Time (ms)")
    plt.title("Performance Curve")
    plt.grid(True, alpha=0.3)
    plt.tight_layout()

    # Save plot
    saving_img_path: Path = results_dir / "performance_curve.png"
    plt.savefig(saving_img_path, dpi=150, bbox_inches="tight")
    print(f"Saved: {saving_img_path}")
    plt.close()


if __name__ == "__main__":
    main()
