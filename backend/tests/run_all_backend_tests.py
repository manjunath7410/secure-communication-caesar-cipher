"""
Test runner for all backend security and endpoint test suites.
"""
import unittest
import sys
import os

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

def run_tests():
    loader = unittest.TestLoader()
    start_dir = os.path.dirname(__file__)
    suite = loader.discover(start_dir, pattern="test_*.py")

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    print("\n" + "=" * 60)
    print(f"Backend Test Run Complete: {result.testsRun} tests executed.")
    print(f"Failures: {len(result.failures)} | Errors: {len(result.errors)}")
    print("=" * 60)

    if not result.wasSuccessful():
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
