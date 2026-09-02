"""Capture the Hyperion workflow builder with a node selected.

Headless Chrome's --screenshot flag can only capture a freshly loaded page, and
the edit panel only appears after a node is clicked. So this drives Chrome over
the DevTools Protocol instead: load the editor, wait for React Flow to lay the
nodes out, issue a real trusted click on one node, then capture.
"""
import json, subprocess, time, urllib.request, sys
import websocket

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PORT = 9222
URL = "http://localhost:4102/workflows/idea-council"
OUT = sys.argv[1]
W, H = int(sys.argv[2]), int(sys.argv[3])
TARGET_NODE = sys.argv[4] if len(sys.argv) > 4 else "advocate"

proc = subprocess.Popen(
    [CHROME, "--headless", "--disable-gpu", "--hide-scrollbars",
     f"--remote-debugging-port={PORT}", f"--window-size={W},{H}", "--remote-allow-origins=*",
     "--force-device-scale-factor=2", "about:blank"],
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def rpc(ws, method, params=None, _id=[0]):
    _id[0] += 1
    ws.send(json.dumps({"id": _id[0], "method": method, "params": params or {}}))
    while True:
        msg = json.loads(ws.recv())
        if msg.get("id") == _id[0]:
            if "error" in msg:
                raise RuntimeError(f"{method}: {msg['error']}")
            return msg.get("result", {})

try:
    # Wait for the debugging endpoint to come up.
    for _ in range(60):
        try:
            tabs = json.load(urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json"))
            page = next(t for t in tabs if t["type"] == "page")
            break
        except Exception:
            time.sleep(0.25)
    else:
        raise SystemExit("chrome devtools endpoint never came up")

    ws = websocket.create_connection(page["webSocketDebuggerUrl"], timeout=30, suppress_origin=True)
    rpc(ws, "Page.enable")
    rpc(ws, "Runtime.enable")
    rpc(ws, "Page.navigate", {"url": URL})
    time.sleep(5)  # let the app boot, fetch the workflow, and lay out the graph

    # Locate the node's on-screen box by its visible label.
    expr = f"""
    (() => {{
      const els = [...document.querySelectorAll('.react-flow__node')];
      const el = els.find(e => e.textContent.trim().startsWith({TARGET_NODE!r}));
      if (!el) return JSON.stringify({{ok:false, seen: els.map(e=>e.textContent.trim().slice(0,24))}});
      const r = el.getBoundingClientRect();
      return JSON.stringify({{ok:true, x:r.x + r.width/2, y:r.y + r.height/2}});
    }})()
    """
    res = rpc(ws, "Runtime.evaluate", {"expression": expr, "returnByValue": True})
    info = json.loads(res["result"]["value"])
    if not info["ok"]:
        raise SystemExit(f"node {TARGET_NODE!r} not found; saw: {info['seen']}")

    x, y = info["x"], info["y"]
    for ev in ("mousePressed", "mouseReleased"):
        rpc(ws, "Input.dispatchMouseEvent",
            {"type": ev, "x": x, "y": y, "button": "left", "clickCount": 1})
        time.sleep(0.15)
    time.sleep(2.0)  # let the edit panel mount and populate

    shot = rpc(ws, "Page.captureScreenshot", {"format": "png"})
    import base64
    open(OUT, "wb").write(base64.b64decode(shot["data"]))
    print(f"wrote {OUT}")
finally:
    proc.terminate()
