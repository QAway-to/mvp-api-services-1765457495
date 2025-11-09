"""
Basic tests for the AI Multi-Agent System
"""
import unittest
from unittest.mock import Mock, patch
import sys
import os

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from validators import CodeValidator
from config import Config


class TestCodeValidator(unittest.TestCase):
    """Test code validation functionality"""

    def test_valid_syntax(self):
        """Test validation of syntactically correct code"""
        code = """
def hello_world():
    print("Hello, World!")
    return True
"""
        valid, issues = CodeValidator.validate_syntax(code)
        self.assertTrue(valid)
        self.assertEqual(len(issues), 0)

    def test_invalid_syntax(self):
        """Test validation of syntactically incorrect code"""
        code = """
def hello_world()
    print("Hello, World!")
    return True
"""
        valid, issues = CodeValidator.validate_syntax(code)
        self.assertFalse(valid)
        self.assertGreater(len(issues), 0)

    def test_comprehensive_validation(self):
        """Test comprehensive validation"""
        code = """
import os

def main():
    print("Hello from validated code!")
    return 0

if __name__ == "__main__":
    main()
"""
        result = CodeValidator.validate_code_comprehensive(code)
        self.assertIn("valid", result)
        self.assertIn("issues", result)
        self.assertIn("checks", result)


class TestConfig(unittest.TestCase):
    """Test configuration management"""

    @patch.dict(os.environ, {
        "GEMINI_API_KEY": "test_key",
        "GITHUB_USER": "test_user",
        "GITHUB_TOKEN": "test_token"
    })
    def test_config_validation(self):
        """Test configuration validation"""
        # Should not raise exception with required env vars
        try:
            Config.validate()
        except ValueError:
            self.fail("Config validation failed with required environment variables")

    def test_config_missing_vars(self):
        """Test configuration with missing variables"""
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(ValueError) as context:
                Config.validate()
            self.assertIn("Missing required environment variables", str(context.exception))


if __name__ == '__main__':
    # Run basic tests
    unittest.main(verbosity=2)

