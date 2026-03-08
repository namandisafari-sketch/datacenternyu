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
      <div style={{ maxWidth: 600, marginLeft: "auto", marginRight: "auto", padding: "0 32px", width: "100%" }}>
        {/* Chrome error icon */}
        <div
          onClick={handleIconClick}
          style={{
            cursor: "default",
            marginBottom: 28,
            width: 72,
            height: 72,
          }}
        >
          <svg width="72" height="72" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges">
            {/* Document outline */}
            <rect x="8" y="4" width="22" height="40" fill="none" stroke="#6B6E72" strokeWidth="3" />
            {/* Folded corner */}
            <rect x="26" y="4" width="10" height="10" fill="#292A2D" />
            <polyline points="26,4 36,14" fill="none" stroke="#6B6E72" strokeWidth="3" />
            <line x1="36" y1="14" x2="36" y2="14" stroke="#6B6E72" strokeWidth="3" />
            <rect x="30" y="4" width="6" height="3" fill="#292A2D" />
            <rect x="26" y="4" width="3" height="10" fill="#292A2D" />
            <line x1="26" y1="14" x2="36" y2="14" stroke="#6B6E72" strokeWidth="3" />
            <line x1="36" y1="14" x2="36" y2="44" stroke="#6B6E72" strokeWidth="3" />
            {/* Left eye */}
            <rect x="15" y="20" width="4" height="5" fill="#6B6E72" />
            {/* Right eye */}
            <rect x="25" y="20" width="4" height="5" fill="#6B6E72" />
            {/* Frown */}
            <rect x="17" y="34" width="3" height="3" fill="#6B6E72" />
            <rect x="20" y="32" width="4" height="3" fill="#6B6E72" />
            <rect x="24" y="34" width="3" height="3" fill="#6B6E72" />
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
          This site can&rsquo;t be reached
        </h1>

        <p
          style={{
            fontSize: "0.9em",
            color: "#9aa0a6",
            margin: "0 0 24px 0",
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: "#e8eaed", fontWeight: 600 }}>{hostname}</strong>{" "}
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
              <span
                onClick={() => setShowDetails(true)}
                style={{ color: "#8ab4f8", cursor: "pointer" }}
              >
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
            {showDetails ? "Hide details" : "Details"}
          </button>
        </div>

        {showDetails && (
          <div
            style={{
              marginTop: 24,
              fontSize: "0.85em",
              color: "#9aa0a6",
              lineHeight: 1.7,
            }}
          >
            <p style={{ margin: "0 0 6px 0", fontWeight: 700, color: "#e8eaed" }}>
              Check your Internet connection
            </p>
            <p style={{ margin: "0 0 20px 0" }}>
              Check any cables and reboot any routers, modems, or other network devices you may be using.
            </p>

            <p style={{ margin: "0 0 6px 0", fontWeight: 700, color: "#e8eaed" }}>
              Allow Chrome to access the network in your firewall or antivirus settings.
            </p>
            <p style={{ margin: "0 0 20px 0" }}>
              If it is already listed as a program allowed to access the network, try removing it from the list and adding it again.
            </p>

            <p style={{ margin: "0 0 6px 0", fontWeight: 700, color: "#e8eaed" }}>
              If you use a proxy server...
            </p>
            <p style={{ margin: 0 }}>
              Go to the Chrome menu &gt; Settings &gt; System &gt; Open your computer's proxy settings &gt; Network &amp; internet &gt; Proxy and deselect "Automatically detect settings".
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FakeErrorPage;
