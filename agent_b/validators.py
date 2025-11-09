"""
Code validation utilities for the AI Multi-Agent System
"""
import ast
import logging
from typing import List, Dict, Any, Tuple

logger = logging.getLogger(__name__)


class CodeValidator:
    """Validate generated Python code"""

    @staticmethod
    def validate_syntax(code: str) -> Tuple[bool, List[str]]:
        """Validate Python syntax using AST"""
        try:
            ast.parse(code)
            return True, []
        except SyntaxError as e:
            return False, [f"Syntax error at line {e.lineno}: {e.msg}"]
        except Exception as e:
            return False, [f"Parse error: {str(e)}"]

    @staticmethod
    def validate_imports(code: str) -> Tuple[bool, List[str]]:
        """Check for potentially problematic imports"""
        issues = []

        # Parse the AST to find imports
        try:
            tree = ast.parse(code)
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        if CodeValidator._is_problematic_import(alias.name):
                            issues.append(f"Potentially unsafe import: {alias.name}")
                elif isinstance(node, ast.ImportFrom):
                    if node.module and CodeValidator._is_problematic_import(node.module):
                        issues.append(f"Potentially unsafe import: {node.module}")
        except SyntaxError:
            # Syntax validation should be done separately
            pass

        return len(issues) == 0, issues

    @staticmethod
    def validate_structure(code: str) -> Tuple[bool, List[str]]:
        """Validate code structure and best practices"""
        issues = []

        try:
            tree = ast.parse(code)

            # Check for main guard
            has_main_guard = any(
                isinstance(node, ast.If) and
                isinstance(node.test, ast.Compare) and
                any(isinstance(comp, ast.Name) and comp.id == "__name__" for comp in [node.test.left])
                for node in ast.walk(tree)
            )

            if not has_main_guard and "__name__" in code:
                issues.append("Missing main guard for executable script")

            # Check for function definitions
            functions = [node for node in ast.walk(tree) if isinstance(node, ast.FunctionDef)]
            classes = [node for node in ast.walk(tree) if isinstance(node, ast.ClassDef)]

            if not functions and not classes and len(code.strip()) > 100:
                issues.append("Large script without functions or classes - consider refactoring")

        except SyntaxError:
            pass

        return len(issues) == 0, issues

    @staticmethod
    def _is_problematic_import(import_name: str) -> bool:
        """Check if import could be problematic"""
        problematic_imports = {
            'os.system', 'subprocess.call', 'eval', 'exec',
            'pickle.loads', 'yaml.load'  # without Loader parameter
        }

        return any(problematic in import_name for problematic in problematic_imports)

    @staticmethod
    def validate_code_comprehensive(code: str) -> Dict[str, Any]:
        """Run all validations and return comprehensive report"""
        syntax_ok, syntax_issues = CodeValidator.validate_syntax(code)
        imports_ok, import_issues = CodeValidator.validate_imports(code)
        structure_ok, structure_issues = CodeValidator.validate_structure(code)

        all_issues = syntax_issues + import_issues + structure_issues
        overall_ok = syntax_ok and imports_ok and structure_ok

        return {
            "valid": overall_ok,
            "issues": all_issues,
            "checks": {
                "syntax": {"valid": syntax_ok, "issues": syntax_issues},
                "imports": {"valid": imports_ok, "issues": import_issues},
                "structure": {"valid": structure_ok, "issues": structure_issues}
            }
        }


def validate_module_result(result: Any) -> Dict[str, Any]:
    """Validate a ModuleResult object"""
    if not hasattr(result, 'path') or not hasattr(result, 'code'):
        return {"valid": False, "issues": ["Invalid result object structure"]}

    if not result.code or result.code.startswith("# Generation failed"):
        return {"valid": False, "issues": ["Empty or failed code generation"]}

    # Run comprehensive validation
    validation = CodeValidator.validate_code_comprehensive(result.code)

    return {
        "valid": validation["valid"],
        "path": result.path,
        "issues": validation["issues"],
        "validation_details": validation["checks"]
    }

