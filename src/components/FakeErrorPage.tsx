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
            width: 48,
            height: 48,
          }}
        >
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges">
            {/* Document body */}
            <rect x="6" y="2" width="24" height="44" fill="#3C4043" />
            <rect x="30" y="14" width="12" height="32" fill="#3C4043" />
            {/* Folded corner */}
            <polygon points="30,2 42,14 30,14" fill="#292A2D" />
            {/* Outline */}
            <path d="M6 2H30L42 14V46H6V2Z" fill="none" stroke="#5F6368" strokeWidth="1" />
            <line x1="30" y1="2" x2="30" y2="14" stroke="#5F6368" strokeWidth="1" />
            <line x1="30" y1="14" x2="42" y2="14" stroke="#5F6368" strokeWidth="1" />
            {/* Pixel eyes - 2x2 blocks */}
            <rect x="16" y="24" width="2" height="2" fill="#9AA0A6" />
            <rect x="18" y="24" width="2" height="2" fill="#9AA0A6" />
            <rect x="16" y="26" width="2" height="2" fill="#9AA0A6" />
            <rect x="18" y="26" width="2" height="2" fill="#9AA0A6" />
            <rect x="28" y="24" width="2" height="2" fill="#9AA0A6" />
            <rect x="30" y="24" width="2" height="2" fill="#9AA0A6" />
            <rect x="28" y="26" width="2" height="2" fill="#9AA0A6" />
            <rect x="30" y="26" width="2" height="2" fill="#9AA0A6" />
            {/* Pixel frown - stepped pixels */}
            <rect x="18" y="36" width="2" height="2" fill="#9AA0A6" />
            <rect x="20" y="34" width="2" height="2" fill="#9AA0A6" />
            <rect x="22" y="34" width="2" height="2" fill="#9AA0A6" />
            <rect x="24" y="34" width="2" height="2" fill="#9AA0A6" />
            <rect x="26" y="34" width="2" height="2" fill="#9AA0A6" />
            <rect x="28" y="36" width="2" height="2" fill="#9AA0A6" />
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
