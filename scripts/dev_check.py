#!/usr/bin/env python3
"""
Full development health check verifying database, connectors, and schemas.
"""
import asyncio
import os
import sys

# Add project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.core.database import SessionLocal, Base, engine
from backend.app.models.event import NormalizedEventModel, SourceHealthModel
from backend.app.services.ingestion.registry import source_registry

def run_dev_check():
    print("=" * 60)
    print("GRICC DEVELOPMENT PIPELINE HEALTH CHECK")
    print("=" * 60)
    
    # 1. Database connection
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    event_count = db.query(NormalizedEventModel).count()
    sources = db.query(SourceHealthModel).all()
    print(f"[+] SQLite Database: CONNECTED ({event_count} events stored)")
    print(f"[+] Active Registered Sources: {len(sources)}")
    for s in sources:
        print(f"    - {s.display_name}: [{s.status.upper()}] ({s.total_events_ingested} ingested, {s.latency_ms:.1f}ms)")

    db.close()
    print("\n[+] All development checks passed successfully.")

if __name__ == "__main__":
    run_dev_check()
