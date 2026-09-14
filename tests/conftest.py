"""Test bootstrap: expose Chorus's pure modules without importing Home Assistant.

`custom_components/chorus/{const,sonos}.py` import only stdlib, so we add that
directory to sys.path and import them as top-level `const` / `sonos`. The HA-bound
modules (`__init__.py`, `coordinator.py`) are never imported here — the business
logic they contain is exercised through the pure functions extracted into sonos.py.
"""
import os
import sys

_CHORUS = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "custom_components", "chorus"
)
if _CHORUS not in sys.path:
    sys.path.insert(0, _CHORUS)
