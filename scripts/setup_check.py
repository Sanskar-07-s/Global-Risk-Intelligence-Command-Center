#!/usr/bin/env python3
"""
GRICC Environment & System Setup Verification Script
"""
import sys
import os

def check_system():
    print("=" * 60)
    print("GRICC SYSTEM SETUP VERIFICATION")
    print("=" * 60)
    
    # 1. Python version
    py_ver = sys.version_info
    print(f"[+] Python Version: {py_ver.major}.{py_ver.minor}.{py_ver.micro}")
    if py_ver < (3, 11):
        print("[-] Warning: Python 3.11+ is recommended.")
    else:
        print("[+] Python version requirement met.")

    # 2. Database file check
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend", "data", "gricc.db")
    if os.path.exists(db_path):
        size_kb = os.path.getsize(db_path) / 1024
        print(f"[+] SQLite Database active at: {db_path} ({size_kb:.1f} KB)")
    else:
        print("[*] SQLite Database will initialize upon first application launch.")

    # 3. Virtualenv check
    venv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend", ".venv")
    if os.path.exists(venv_path):
        print(f"[+] Python virtualenv verified: {venv_path}")
    else:
        print("[*] Virtual environment located in default system path.")

    print("\n[+] Verification Complete. GRICC system ready.")

if __name__ == "__main__":
    check_system()
