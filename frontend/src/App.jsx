
import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import "./App.css";

const API_URL = "https://codeguard-ai-gxha.onrender.com";

function App() {
  const [code, setCode] = useState(
`def calculate_total(price, quantity):
    total = price * quantity
    return total

print(calculate_total(100, 2))`
  );

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [applyMessage, setApplyMessage] = useState("");

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const [testCode, setTestCode] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState("");
  const [testCopyMessage, setTestCopyMessage] = useState("");

  // Load previous review history
  const loadHistory = async () => {
    setHistoryLoading(true);
    setHistoryError("");

    try {
      const response = await fetch(`${API_URL}/history`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to load history");
      }

      setHistory(data.history || []);
    } catch (err) {
      setHistoryError(err.message || "Unable to connect to backend.");
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // Open previous review
  const openHistory = async (id) => {
    setHistoryError("");

    try {
      const response = await fetch(`${API_URL}/history/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to open review");
      }

      setCode(data.code);
      setResult({
        static_review: data.review_result
      });

      setCopyMessage("");
      setApplyMessage("");
      setTestCode("");

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setHistoryError(err.message || "Unable to open review.");
    }
  };

  // Review, AI Explain and Auto-Fix
  const reviewCode = async (endpoint) => {
    setLoading(true);
    setError("");
    setResult(null);
    setCopyMessage("");
    setApplyMessage("");

    try {
      const response = await fetch(`${API_URL}/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          language: "python",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Request failed");
      }

      setResult(data);
      loadHistory();
    } catch (err) {
      setError(err.message || "Unable to connect to backend.");
    } finally {
      setLoading(false);
    }
  };

  // Copy corrected code
  const copyFixedCode = async () => {
    try {
      await navigator.clipboard.writeText(
        result.auto_fix.corrected_code
      );

      setCopyMessage("Corrected code copied successfully!");
    } catch {
      setCopyMessage("Unable to copy. Please copy manually.");
    }
  };

  // Apply AI fix
  const applyFix = () => {
    setCode(result.auto_fix.corrected_code);
    setApplyMessage("AI fix applied to the main editor!");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Generate Unit Tests
  const generateTests = async () => {
    setTestLoading(true);
    setTestError("");
    setTestCode("");
    setTestCopyMessage("");

    try {
      const response = await fetch(`${API_URL}/generate-tests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          language: "python",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Test generation failed");
      }

      setTestCode(data.generated_tests);
    } catch (err) {
      setTestError(err.message || "Unable to generate tests.");
    } finally {
      setTestLoading(false);
    }
  };

  // Copy generated tests
  const copyTestCode = async () => {
    try {
      await navigator.clipboard.writeText(testCode);
      setTestCopyMessage("Test code copied successfully!");
    } catch {
      setTestCopyMessage("Unable to copy. Please copy manually.");
    }
  };

  const review = result?.review || result?.static_review;
  const autoFix = result?.auto_fix;

  return (
    <div className="app">

      <header className="navbar">
        <div className="brand">
          <span className="brand-icon">🛡️</span>
          <span>CodeGuard <strong>AI</strong></span>
        </div>

        <span className="status">
          <span className="status-dot"></span>
          AI Engine Ready
        </span>
      </header>

      <main className="container">

        {/* Hero */}
        <section className="hero">
          <p className="eyebrow">INTELLIGENT CODE ANALYSIS</p>

          <h1>
            Write better code.<br />
            <span>Build with confidence.</span>
          </h1>

          <p className="subtitle">
            Analyze Python code, detect security risks,
            and get AI-powered suggestions.
          </p>
        </section>

        {/* Code Editor */}
        <section className="workspace">

          <div className="section-heading">
            <div>
              <h2>Code Editor</h2>
              <p>Write or paste your Python code below.</p>
            </div>

            <span className="language">PYTHON</span>
          </div>

          <div className="monaco-container">
            <Editor
              height="380px"
              language="python"
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || "")}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                automaticLayout: true,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                wordWrap: "on",
                tabSize: 4,
                suggestOnTriggerCharacters: true,
                padding: { top: 15 },
              }}
            />
          </div>

          <div className="actions">
            <button
              className="review-btn"
              onClick={() => reviewCode("review")}
              disabled={loading || !code.trim()}
            >
              {loading ? "Analyzing..." : "🔍 Review Code"}
            </button>

            <button
              className="ai-btn"
              onClick={() => reviewCode("ai-explain")}
              disabled={loading || !code.trim()}
            >
              {loading ? "Please wait..." : "✨ AI Explain"}
            </button>

            <button
              className="ai-btn"
              onClick={() => reviewCode("auto-fix")}
              disabled={loading || !code.trim()}
            >
              {loading ? "Fixing..." : "🛠️ Auto-Fix Code"}
            </button>
          </div>

        </section>

        {error && (
          <div className="error">
            <strong>Something went wrong:</strong> {error}
          </div>
        )}

        {loading && (
          <p className="loading">
            Analyzing your code. Please wait...
          </p>
        )}

        {/* Review Results */}
        {review && (
          <section className="results">

            <h2>Code Review Results</h2>

            <div className="score-card">
              <div>
                <p>Code Quality Score</p>
                <h3>
                  {review.quality_score ?? 0}
                  <small>/100</small>
                </h3>
              </div>

              <div className="issue-count">
                <strong>{review.total_issues ?? 0}</strong>
                <span>Issues found</span>
              </div>
            </div>

            <h3 className="subheading">Detected Issues</h3>

            {review.issues?.length ? (
              review.issues.map((issue, index) => (
                <article className="issue-card" key={index}>
                  <div className="issue-top">
                    <strong>{issue.category}</strong>

                    <span
                      className={`severity ${issue.severity.toLowerCase()}`}
                    >
                      {issue.severity}
                    </span>
                  </div>

                  <p>{issue.message}</p>
                  <p className="line">Line: {issue.line}</p>

                  <p className="suggestion">
                    <strong>Suggestion:</strong> {issue.suggestion}
                  </p>
                </article>
              ))
            ) : (
              <p className="success-message">
                🎉 No issues detected!
              </p>
            )}

            {review.tools && (
              <div className="tools">
                <h3>Analysis Tools</h3>
                <p>Ruff: {review.tools.ruff}</p>
                <p>Bandit: {review.tools.bandit}</p>
              </div>
            )}

            {result.ai_explanation && (
              <div className="ai-result">
                <h3>✨ AI Explanation</h3>
                <p>{result.ai_explanation}</p>
              </div>
            )}

          </section>
        )}

        {/* Auto Fix Results */}
        {autoFix && (
          <section className="results">

            <h2>🛠️ AI Auto-Fix Results</h2>

            <div className="ai-result">
              <h3>Explanation</h3>
              <p>{autoFix.explanation}</p>
            </div>

            <h3 className="subheading">Changes Made</h3>

            {autoFix.changes.length > 0 ? (
              <ul>
                {autoFix.changes.map((change, index) => (
                  <li key={index}>{change}</li>
                ))}
              </ul>
            ) : (
              <p>No changes were necessary.</p>
            )}

            <div className="section-heading">
              <div>
                <h3>Corrected Python Code</h3>
                <p>Review the AI-generated code before using it.</p>
              </div>
            </div>

            <div className="monaco-container">
              <Editor
                height="350px"
                language="python"
                theme="vs-dark"
                value={autoFix.corrected_code}
                options={{
                  readOnly: true,
                  fontSize: 14,
                  minimap: { enabled: false },
                  automaticLayout: true,
                  lineNumbers: "on",
                  wordWrap: "on",
                  scrollBeyondLastLine: false,
                  padding: { top: 15 },
                }}
              />
            </div>

            <div className="actions">
              <button
                className="review-btn"
                onClick={applyFix}
              >
                ✅ Apply Fix
              </button>

              <button
                className="ai-btn"
                onClick={copyFixedCode}
              >
                📋 Copy Corrected Code
              </button>
            </div>

            {applyMessage && (
              <p className="success-message">{applyMessage}</p>
            )}

            {copyMessage && (
              <p className="success-message">{copyMessage}</p>
            )}

            <p className="line">
              Review and test AI-generated changes before using them.
            </p>

          </section>
        )}

        {/* Unit Test Generator */}
        <section className="results">

          <h2>🧪 AI Unit Test Generator</h2>

          <p>
            Generate Python pytest test cases automatically
            for your code.
          </p>

          <div className="actions">
            <button
              className="review-btn"
              onClick={generateTests}
              disabled={testLoading || !code.trim()}
            >
              {testLoading
                ? "Generating Tests..."
                : "🧪 Generate Unit Tests"}
            </button>
          </div>

          {testLoading && (
            <p className="loading">
              AI is generating your test cases. Please wait...
            </p>
          )}

          {testError && (
            <div className="error">
              {testError}
            </div>
          )}

          {testCode && (
            <>
              <h3 className="subheading">
                Generated Pytest Code
              </h3>

              <div className="monaco-container">
                <Editor
                  height="350px"
                  language="python"
                  theme="vs-dark"
                  value={testCode}
                  options={{
                    readOnly: true,
                    fontSize: 14,
                    minimap: { enabled: false },
                    automaticLayout: true,
                    lineNumbers: "on",
                    wordWrap: "on",
                    scrollBeyondLastLine: false,
                    padding: { top: 15 },
                  }}
                />
              </div>

              <div className="actions">
                <button
                  className="ai-btn"
                  onClick={copyTestCode}
                >
                  📋 Copy Test Code
                </button>
              </div>

              {testCopyMessage && (
                <p className="success-message">
                  {testCopyMessage}
                </p>
              )}

              <p className="line">
                Generated tests are suggestions. Review and run them
                in a safe test environment before relying on them.
              </p>
            </>
          )}

        </section>

        {/* Review History */}
        <section className="results history-section">

          <div className="section-heading">
            <div>
              <h2>📚 Review History</h2>
              <p>View your previously saved code reviews.</p>
            </div>

            <button
              className="ai-btn"
              onClick={loadHistory}
              disabled={historyLoading}
            >
              {historyLoading ? "Loading..." : "↻ Refresh"}
            </button>
          </div>

          {historyError && (
            <div className="error">{historyError}</div>
          )}

          {historyLoading && history.length === 0 ? (
            <p className="loading">
              Loading review history...
            </p>
          ) : history.length > 0 ? (
            history.map((item) => (
              <article className="issue-card" key={item.id}>

                <div className="issue-top">
                  <strong>Review #{item.id}</strong>

                  <span className="language">
                    {item.language.toUpperCase()}
                  </span>
                </div>

                <p>
                  Quality Score:{" "}
                  <strong>{item.quality_score}/100</strong>
                </p>

                <p>
                  Issues Found:{" "}
                  <strong>{item.total_issues}</strong>
                </p>

                <p className="line">
                  {new Date(item.created_at).toLocaleString()}
                </p>

                <button
                  className="review-btn"
                  onClick={() => openHistory(item.id)}
                >
                  Open Previous Review
                </button>

              </article>
            ))
          ) : (
            !historyLoading && (
              <p>
                No review history yet. Review some code to get started!
              </p>
            )
          )}

        </section>

        <footer>
          CodeGuard AI · Intelligent Code Review & Bug Detection
        </footer>

      </main>
    </div>
  );
}

export default App;
