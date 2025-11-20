#!/usr/bin/env python3
import os
from pathlib import Path
db = Path(__file__).parent / 'onboard.db'
if db.exists():
    print('Removing', db)
    db.unlink()
    print('DB removed.')
else:
    print('No DB file found at', db)
