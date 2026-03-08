import { useState, useCallback } from "react";

interface FakeErrorPageProps {
  onUnlock: () => void;
}

const FakeErrorPage = ({ onUnlock }: FakeErrorPageProps) => {
  const [clickCount, setClickCount] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  const handleIconClick = useCallback(() => {
    const next = clickCount + 1;
    setClickCount(next);
    if (next >= 5) {
      onUnlock();
    }
  }, [clickCount, onUnlock]);

  const hostname = window.location.hostname;

  return (
    <div
      style={{
        fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        backgroundColor: "#292a2d",
        color: "#9aa0a6",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        paddingTop: "calc(100vh * 0.18)",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      <div style={{ maxWidth: 540, marginLeft: "auto", marginRight: "auto", padding: "0 32px", width: "100%" }}>
        {/* Chrome's exact error icon: document with folded corner */}
        <div
          onClick={handleIconClick}
          style={{
            cursor: "default",
            marginBottom: 28,
            width: 48,
            height: 48,
          }}
        >
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Outer page shape */}
            <path
              d="M8 4h22l12 12v28H8V4z"
              fill="none"
              stroke="#636466"
              strokeWidth="2"
            />
            {/* Folded corner */}
            <path
              d="M30 4v12h12"
              fill="none"
              stroke="#636466"
              strokeWidth="2"
            />
            {/* Lines on page */}
            <line x1="14" y1="22" x2="34" y2="22" stroke="#636466" strokeWidth="1.5" />
            <line x1="14" y1="28" x2="34" y2="28" stroke="#636466" strokeWidth="1.5" />
            <line x1="14" y1="34" x2="26" y2="34" stroke="#636466" strokeWidth="1.5" />
          </svg>
        </div>

        <h1
          style={{
            fontSize: "1.3em",
            fontWeight: "normal",
            color: "#e8eaed",
            margin: "0 0 8px 0",
            lineHeight: 1.4,
          }}
        >
          This site can't be reached
        </h1>

        <p
          style={{
            fontSize: "0.9em",
            color: "#9aa0a6",
            margin: "0 0 24px 0",
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: "#e8eaed", fontWeight: 600 }}>
            {hostname}
          </strong>{" "}
          refused to connect.
        </p>

        <div
          style={{
            fontSize: "0.9em",
            color: "#9aa0a6",
            margin: "0 0 8px 0",
            lineHeight: 1.8,
          }}
        >
          <p style={{ margin: "0 0 4px 0" }}>Try:</p>
          <ul style={{ paddingLeft: 28, margin: 0, listStyleType: "disc" }}>
            <li style={{ marginBottom: 1 }}>Checking the connection</li>
            <li>
              <span style={{ color: "#8ab4f8" }}>
                Checking the proxy and the firewall
              </span>
            </li>
          </ul>
        </div>

        <p
          style={{
            fontSize: "0.8em",
            color: "#9aa0a6",
            fontFamily: "monospace",
            margin: "16px 0 28px 0",
          }}
        >
          ERR_CONNECTION_REFUSED
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "8px 24px",
              fontSize: "0.85em",
              fontWeight: 500,
              fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
              borderRadius: 4,
              border: "none",
              backgroundColor: "#8ab4f8",
              color: "#202124",
              cursor: "pointer",
              outline: "none",
            }}
          >
            Reload
          </button>

          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{
              padding: "8px 16px",
              fontSize: "0.85em",
              fontWeight: 500,
              fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
              borderRadius: 4,
              border: "1px solid #5f6368",
              backgroundColor: "transparent",
              color: "#8ab4f8",
              cursor: "pointer",
              outline: "none",
            }}
          >
            Details
          </button>
        </div>

        {showDetails && (
          <div
            style={{
              marginTop: 16,
              fontSize: "0.8em",
              color: "#9aa0a6",
              lineHeight: 1.7,
              borderTop: "1px solid #3c4043",
              paddingTop: 12,
            }}
          >
            <p style={{ margin: 0 }}>{hostname}'s server IP address could not be found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FakeErrorPage;
