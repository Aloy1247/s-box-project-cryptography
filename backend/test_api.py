"""Test script for S-box Forge API."""
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

print("=== Testing S-box Forge API ===\n")

# Test 1: Health check
print("1. Health Check...")
r = requests.get(f"{BASE_URL}/")
print(f"   Status: {r.status_code}")
print(f"   Response: {r.json()}\n")

# Test 2: List matrices
print("2. List Matrices...")
r = requests.get(f"{BASE_URL}/api/matrices")
print(f"   Status: {r.status_code}")
data = r.json()
print(f"   Found {len(data['matrices'])} matrices")
print(f"   KAES hasMatrix: {data['matrices'][0]['hasMatrix']}\n")

# Test 3: Get matrix detail
print("3. Get KAES Matrix...")
r = requests.get(f"{BASE_URL}/api/matrices/KAES")
print(f"   Status: {r.status_code}")
data = r.json()
print(f"   Name: {data['name']}")
print(f"   Matrix available: {data['matrix'] is not None}\n")

# Test 4: Analyze
print("4. Analyze KAES S-box...")
r = requests.post(
    f"{BASE_URL}/api/analyze",
    json={"matrixId": "KAES", "constant": "63"}
)
print(f"   Status: {r.status_code}")
if r.status_code == 200:
    data = r.json()
    print(f"   S-box generated: {len(data['sbox'])}x{len(data['sbox'][0])}")
    print(f"   Fixed points: {data['fixedPoints']}")
    print(f"   Calculation time: {data['calculationTimeMs']}ms")
    print(f"   Analysis metrics:")
    for k, v in data['analysis'].items():
        print(f"      {k}: {v}")
else:
    print(f"   Error: {r.text}")

print("\n=== All tests complete ===")
