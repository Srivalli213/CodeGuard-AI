
import ast
import json
import subprocess
import sys
import tempfile

from pathlib import Path


def analyze_code(source_code):

    issues = []

    # 1. Check Python syntax
    try:
        tree = ast.parse(source_code)

    except SyntaxError as error:
        return {
            "success": False,
            "quality_score": 0,
            "total_issues": 1,
            "issues": [
                {
                    "line": error.lineno or 1,
                    "severity": "High",
                    "category": "Syntax Error",
                    "message": error.msg,
                    "suggestion": "Correct the Python syntax."
                }
            ],
            "summary": "Syntax validation failed."
        }

    # 2. Custom security and code quality checks
    for node in ast.walk(tree):

        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):

            if node.func.id in ["eval", "exec"]:
                issues.append({
                    "line": node.lineno,
                    "severity": "High",
                    "category": "Security",
                    "message": f"Use of {node.func.id}() detected.",
                    "suggestion": "Avoid dynamic code execution."
                })

        if isinstance(node, ast.ExceptHandler) and node.type is None:

            issues.append({
                "line": node.lineno,
                "severity": "Medium",
                "category": "Code Quality",
                "message": "Bare except clause detected.",
                "suggestion": "Catch specific exceptions."
            })

    tool_status = {}

    # 3. Analyze code using temporary file
    with tempfile.TemporaryDirectory() as temp_dir:

        file_path = Path(temp_dir) / "user_code.py"
        file_path.write_text(source_code, encoding="utf-8")

        # 4. Ruff code quality analysis
        try:
            result = subprocess.run(
                [
                    sys.executable,
                    "-m",
                    "ruff",
                    "check",
                    "--output-format",
                    "json",
                    str(file_path)
                ],
                capture_output=True,
                text=True,
                timeout=15
            )

            ruff_results = json.loads(result.stdout or "[]")

            for item in ruff_results:

                line_number = item.get(
                    "location", {}
                ).get("row", 1)

                code = item.get("code", "")
                message = item.get(
                    "message",
                    "Code issue detected"
                )

                # 5. Check duplicate security findings
                duplicate = any(
                    existing["line"] == line_number
                    and existing["category"] == "Security"
                    and (
                        (
                            code == "S102"
                            and "exec()" in existing["message"].lower()
                        )
                        or
                        (
                            code == "S307"
                            and "eval()" in existing["message"].lower()
                        )
                    )
                    for existing in issues
                )

                if not duplicate:
                    issues.append({
                        "line": line_number,
                        "severity": "Medium",
                        "category": "Code Quality",
                        "message": f"{code}: {message}",
                        "suggestion": message
                    })

            tool_status["ruff"] = "completed"

        except (
            subprocess.TimeoutExpired,
            FileNotFoundError,
            json.JSONDecodeError
        ):
            tool_status["ruff"] = "unavailable or failed"

        # 6. Bandit security analysis
        try:
            result = subprocess.run(
                [
                    sys.executable,
                    "-m",
                    "bandit",
                    "-f",
                    "json",
                    str(file_path)
                ],
                capture_output=True,
                text=True,
                timeout=15
            )

            bandit_report = json.loads(result.stdout or "{}")

            for item in bandit_report.get("results", []):

                severity = item.get(
                    "issue_severity",
                    "MEDIUM"
                ).capitalize()

                message = item.get(
                    "issue_text",
                    "Security issue detected."
                )

                line_number = item.get("line_number", 1)
                test_id = item.get("test_id", "")

                # Check duplicate eval() and exec() findings
                duplicate = any(
                    existing["line"] == line_number
                    and existing["category"] == "Security"
                    and (
                        (
                            "eval()" in existing["message"].lower()
                            and test_id == "B307"
                        )
                        or
                        (
                            "exec()" in existing["message"].lower()
                            and test_id == "B102"
                        )
                    )
                    for existing in issues
                )

                if severity not in ["High", "Medium", "Low"]:
                    severity = "Medium"

                if not duplicate:
                    issues.append({
                        "line": line_number,
                        "severity": severity,
                        "category": "Security",
                        "message": message,
                        "suggestion": item.get(
                            "more_info",
                            "Review this potential security issue."
                        )
                    })

            tool_status["bandit"] = "completed"

        except (
            subprocess.TimeoutExpired,
            FileNotFoundError,
            json.JSONDecodeError
        ):
            tool_status["bandit"] = "unavailable or failed"

    # 7. Calculate quality score
       
    deductions = {
        "High": 25,
        "Medium": 10,
        "Low": 5
    }

    total_deduction = sum(
        deductions.get(issue["severity"], 5)
        for issue in issues
    )

    score = max(0, 100 - total_deduction)

    # 8. Prepare final review report
    return {
        "success": True,
        "quality_score": score,
        "total_issues": len(issues),
        "issues": issues,
        "tools": tool_status,
        "summary": (
            "No issues detected."
            if not issues
            else f"Found {len(issues)} potential issue(s)."
        )
    }
