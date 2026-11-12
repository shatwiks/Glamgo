#!/usr/bin/env python3
"""
GlamGo Database Inspector Utility
Inspect all database tables, record counts, and sample records.
Usage: python scripts/inspect_db.py
"""
import os
import sys
from pathlib import Path

# Add project root to sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from sqlalchemy import create_engine, text
from backend.app.core.config import settings

def inspect_database():
    print("=" * 70)
    print("        GLAMGO DATABASE EXPLORER & INVENTORY REPORT")
    print("=" * 70)
    print(f"Connecting to: {settings.DATABASE_URL.split('@')[-1]}")
    
    try:
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as conn:
            # 1. Table Inventory
            tables = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name;
            """)).fetchall()
            
            print("\n📋 TABLE RECORD COUNTS:")
            print("-" * 50)
            for (table_name,) in tables:
                count = conn.execute(text(f'SELECT COUNT(*) FROM "{table_name}"')).scalar()
                print(f" • {table_name:<30} : {count:>5} records")
            
            # 2. Sample Users
            print("\n👤 SAMPLE USERS (Latest 5):")
            print("-" * 70)
            users = conn.execute(text("""
                SELECT id, email, full_name, role, is_active 
                FROM users 
                ORDER BY id DESC 
                LIMIT 5;
            """)).fetchall()
            for u in users:
                print(f" ID: {u[0]:<3} | Email: {u[1]:<28} | Name: {u[2]:<16} | Role: {u[3]:<12}")
            
            # 3. Sample Products / Catalog Items
            print("\n🛍️ SAMPLE PRODUCTS / ITEMS (Latest 5):")
            print("-" * 70)
            products = conn.execute(text("""
                SELECT id, name, brand, category, price, is_active 
                FROM products 
                ORDER BY id DESC 
                LIMIT 5;
            """)).fetchall()
            for p in products:
                price_str = f"₹{p[4]:,.2f}" if p[4] else "N/A"
                print(f" ID: {p[0]:<3} | Name: {p[1]:<28} | Brand: {p[2]:<15} | Price: {price_str:<10}")

            # 4. Sample Bookings & Orders
            orders_count = conn.execute(text('SELECT COUNT(*) FROM orders')).scalar()
            bookings_count = conn.execute(text('SELECT COUNT(*) FROM bookings')).scalar()
            salons_count = conn.execute(text('SELECT COUNT(*) FROM salons')).scalar()
            pros_count = conn.execute(text('SELECT COUNT(*) FROM professional_profiles')).scalar()
            sellers_count = conn.execute(text('SELECT COUNT(*) FROM seller_listings')).scalar()
            
            print("\n📊 BUSINESS OVERVIEW:")
            print("-" * 50)
            print(f" • Total Registered Users:      {conn.execute(text('SELECT COUNT(*) FROM users')).scalar()}")
            print(f" • Total Orders Placed:        {orders_count}")
            print(f" • Total Service Bookings:     {bookings_count}")
            print(f" • Registered Salons:          {salons_count}")
            print(f" • Professional Profiles:      {pros_count}")
            print(f" • Active Seller Listings:     {sellers_count}")
            print("=" * 70)
            
    except Exception as e:
        print(f"\n[ERROR] Could not connect to database: {e}", file=sys.stderr)

if __name__ == "__main__":
    inspect_database()
