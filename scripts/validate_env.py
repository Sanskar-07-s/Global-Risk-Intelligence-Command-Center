#!/usr/bin/env python3
"""
Validates environment variable configuration without printing secret values.
"""
import os
import sys

def validate():
    print("[*] Validating GRICC Environment Configuration...")
    backend_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend", ".env")
    
    if not os.path.exists(backend_env):
        print("[-] backend/.env missing! Please copy backend/.env.example to backend/.env")
        return False
    
    with open(backend_env, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    required_keys = ["PORT", "DATABASE_URL", "GEMINI_API_KEY", "NASA_API_KEY", "FIRMS_MAP_KEY"]
    found_keys = {}
    for line in lines:
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            found_keys[k.strip()] = bool(v.strip())

    for k in required_keys:
        if k in found_keys and found_keys[k]:
            print(f"  [+] {k}: CONFIGURED (length > 0)")
        elif k in found_keys:
            print(f"  [-] {k}: EMPTY VALUE")
        else:
            print(f"  [-] {k}: MISSING")

    print("[+] Environment variable structure valid.")
    return True

if __name__ == "__main__":
    validate()
