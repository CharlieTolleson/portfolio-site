"""Capture a stepper figure at each of its steps.

The split figure on the news-event-detection page only shows its argument if you
advance it, so a single screenshot of the page proves nothing about steps 1..n.
This drives Chrome over the DevTools Protocol, clicks each step button in turn,
waits for the layout transition to settle, and captures the figure each time.

Usage: python shot_steps.py <url> <figure-index> <out-prefix>

Kill any leftover Chrome by port if a run is interrupted; the script closes its
own instance on the way out.
"""
import base64, json, subprocess, sys, time, urllib.request
import websocket

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PORT = 9227
URL, FIG_INDEX, PREFIX = sys.argv[1], int(sys.argv[2]), sys.argv[3]
W, H = 1440, 1000

proc = subprocess.Popen(
    [CHROME, "--headless", "--disable-gpu", "--hide-scrollbars",
     f"--remote-debugging-port={PORT}", f"--window-size={W},{H}",
     "--remote-allow-origins=*", "--force-device-scale-factor=1", "about:blank"],
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


def evaluate(ws, expr):
    r = rpc(ws, "Runtime.evaluate", {"expression": expr, "returnByValue": True})
    return r.get("result", {}).get("value")


try:
    for _ in range(60):
        try:
            tabs = json.load(urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json"))
            page = next(t for t in tabs if t["type"] == "page")
            break
        except Exception:
            time.sleep(0.25)
    else:
        raise SystemExit("chrome devtools endpoint never came up")

    ws = websocket.create_connection(page["webSocketDebuggerUrl"], timeout=30,
                                     suppress_origin=True)
    rpc(ws, "Page.enable")
    rpc(ws, "Runtime.enable")
    rpc(ws, "Page.navigate", {"url": URL})
    time.sleep(4)

    fig = f"document.querySelectorAll('figure')[{FIG_INDEX}]"
    steps = evaluate(ws, f"{fig}.querySelectorAll('button').length")
    print(f"steps: {steps}")

    for i in range(steps):
        evaluate(ws, f"{fig}.querySelectorAll('button')[{i}].click()")
        evaluate(ws, f"{fig}.scrollIntoView({{block:'center'}})")
        # The layout transition is 0.6s; give it margin so no frame is captured
        # mid-flight, which would misrepresent the final positions.
        time.sleep(2.0)
        # Full viewport rather than a clip. CDP's clip rect is in page
        # coordinates while getBoundingClientRect returns viewport coordinates,
        # and mixing the two silently captures empty page instead of the figure.
        shot = rpc(ws, "Page.captureScreenshot", {"format": "png"})
        out = f"{PREFIX}-step{i}.png"
        with open(out, "wb") as f:
            f.write(base64.b64decode(shot["data"]))
        print("wrote", out)
finally:
    proc.terminate()
