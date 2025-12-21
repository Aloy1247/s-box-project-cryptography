"""Test K44 matrix analysis."""
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

print("Testing K44 matrix analysis...")
r = requests.post(
    f"{BASE_URL}/api/analyze",
    json={"matrixId": "K44", "constant": "63"}
)

if r.ok:
    data = r.json()
    print(f"Status: {r.status_code}")
    print(f"S-box generated: {len(data['sbox'])}x{len(data['sbox'][0])}")
    print(f"Fixed points: {data['fixedPoints']}")
    print(f"Calc time: {data['calculationTimeMs']}ms")
    print("Metrics:")
    for k, v in data['analysis'].items():
        print(f"  {k}: {v}")
else:
    print(f"Error {r.status_code}: {r.text}")
