"""Capture each figure on a page after its scroll-triggered animation settles.

Headless Chrome's --screenshot flag captures a freshly loaded page only, and
these figures animate in when they scroll into view. So this drives Chrome over
the DevTools Protocol: load the page, scroll each figure to center, wait real
time for the motion animation to finish, then capture.

Usage: python shot_figs.py <url> <out-prefix>
"""
import base64, json, subprocess, sys, time, urllib.request
import websocket

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PORT = 9223
URL = sys.argv[1]
PREFIX = sys.argv[2]
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

    count = evaluate(ws, "document.querySelectorAll('figure').length")
    print("figures:", count)

    for i in range(count):
        evaluate(ws, f"document.querySelectorAll('figure')[{i}]"
                     ".scrollIntoView({block:'center'})")
        # Real time, not virtual: the motion animations are rAF driven and the
        # longest stagger on these figures runs about 1.5s.
        time.sleep(3.5)
        shot = rpc(ws, "Page.captureScreenshot", {"format": "png"})
        out = f"{PREFIX}-{i}.png"
        with open(out, "wb") as f:
            f.write(base64.b64decode(shot["data"]))
        print("wrote", out)
finally:
    proc.terminate()
