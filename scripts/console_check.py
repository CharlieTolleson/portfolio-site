"""Report console errors and warnings from a page, against a production build.

Next's dev overlay hides some issues and invents others (the HMR websocket fails
in headless Chrome and looks like a real error), so hydration mismatches are only
trustworthy when checked against `npx next start`. This drives Chrome over the
DevTools Protocol, subscribes to Runtime and Log events, and prints anything at
warning level or above for each URL given.

Usage:
    npx next start -p 3311 &
    python scripts/console_check.py http://localhost:3311/ http://localhost:3311/work/foo
"""
import json, subprocess, sys, time, urllib.request
import websocket
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PORT=9225
proc=subprocess.Popen([CHROME,"--headless","--disable-gpu",f"--remote-debugging-port={PORT}",
 "--window-size=1440,900","--remote-allow-origins=*","about:blank"],
 stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
def rpc(ws,m,p=None,_i=[0]):
    _i[0]+=1; ws.send(json.dumps({"id":_i[0],"method":m,"params":p or {}}))
    while True:
        r=json.loads(ws.recv())
        if r.get("id")==_i[0]: return r.get("result",{})
try:
    for _ in range(60):
        try:
            page=next(t for t in json.load(urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json")) if t["type"]=="page"); break
        except Exception: time.sleep(0.25)
    ws=websocket.create_connection(page["webSocketDebuggerUrl"],timeout=30,suppress_origin=True)
    rpc(ws,"Page.enable"); rpc(ws,"Runtime.enable"); rpc(ws,"Log.enable")
    for url in sys.argv[1:]:
        rpc(ws,"Page.navigate",{"url":url})
        found=[]; ws.settimeout(6)
        deadline=time.time()+7
        while time.time()<deadline:
            try: msg=json.loads(ws.recv())
            except Exception: break
            m=msg.get("method")
            if m=="Runtime.consoleAPICalled" and msg["params"]["type"] in ("error","warning"):
                found.append(("console."+msg["params"]["type"], str(msg["params"].get("args"))[:300]))
            if m=="Runtime.exceptionThrown":
                found.append(("exception", str(msg["params"])[:300]))
            if m=="Log.entryAdded" and msg["params"]["entry"]["level"] in ("error","warning"):
                found.append(("log."+msg["params"]["entry"]["level"], msg["params"]["entry"]["text"][:300]))
        print(f"\n=== {url}")
        print("CLEAN: no console errors or warnings" if not found else "\n".join(f"  {k}: {v}" for k,v in found))
finally: proc.terminate()
