// Run with backend :5000 and frontend :5173. Uses installed Chrome; no extra packages.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
require("dotenv").config({ path: path.join(__dirname, "../.env"), quiet: true });
const mongoose = require("mongoose");
const User = require("../models/User");
const Session = require("../models/Session");
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const email = `browser-${Date.now()}@example.test`;
const password = "CampusDemo123";
const title = `Browser Notice ${Date.now()}`;
let browser, ws, userId;
let nextId = 0;
const pending = new Map();
const errors = [];
function send(method, params = {}) {
  const id = ++nextId;
  return new Promise((resolve, reject) => { pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
}
async function evaluate(expression) {
  const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true, userGesture: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text + ": " + result.exceptionDetails.exception?.description);
  return result.result?.value;
}
async function until(expression, label, timeout = 20000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { try { if (await evaluate(`Boolean(${expression})`)) return; } catch {} await delay(100); }
  throw new Error(`Timed out: ${label}; URL: ${await evaluate("location.href")}; text: ${(await evaluate("document.body.innerText")).slice(-1000)}`);
}
async function navigate(route) {
  await send("Page.navigate", { url: "http://localhost:5173" + route });
  await until(`(location.pathname === ${JSON.stringify(route)} || (${JSON.stringify(route)} === "/student-dashboard" && location.pathname === "/login") || (${JSON.stringify(route)} === "/admin-dashboard" && location.pathname === "/student-dashboard")) && document.readyState === "complete"`, route);
}
async function fill(selector, value) {
  await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) throw new Error('Missing input'); Object.getOwnPropertyDescriptor(el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,'value').set.call(el,${JSON.stringify(value)}); el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); })()`);
}
async function login() {
  await navigate("/login"); await fill('input[type="email"]', email); await fill('input[placeholder="Password"]', password); await evaluate("document.querySelector('form').requestSubmit()");
}
(async () => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "campus-browser-"));
  browser = spawn("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"], { windowsHide: true, stdio: "ignore" });
  browser.on("error", error => errors.push(error.message));
  const portFile = path.join(profile, "DevToolsActivePort");
  for (let i = 0; i < 100 && !fs.existsSync(portFile); i++) await delay(100);
  if (!fs.existsSync(portFile)) throw new Error("Chrome did not start");
  const port = fs.readFileSync(portFile, "utf8").split("\n")[0];
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolve => ws.addEventListener("open", resolve));
  ws.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) { const p = pending.get(message.id); pending.delete(message.id); message.error ? p.reject(new Error(message.error.message)) : p.resolve(message.result); }
    if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
  });
  await send("Page.enable"); await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await navigate("/student-dashboard"); await until("location.pathname === '/login'", "logged-out dashboard protection");
  console.log("PASS logged-out dashboard protection");
  await navigate("/register");
  await fill('input[placeholder="Full Name"]', "Browser Demo Student"); await fill('input[type="email"]', email); await fill('input[placeholder="Password"]', password); await fill('input[placeholder="Confirm Password"]', password);
  await evaluate("document.querySelector('form').requestSubmit()"); await until("document.body.innerText.includes('Registration successful') || location.pathname === '/login'", "register");
  await login(); await until("location.pathname === '/student-dashboard' && document.body.innerText.includes('Browser Demo Student!')", "student login");
  await until("!document.body.innerText.includes('Loading') && document.querySelectorAll('.announcement-item').length >= 3 && document.querySelectorAll('.schedule-item').length >= 3", "dashboard data");
  assert.equal(await evaluate("document.querySelectorAll('.dashboard-event-card').length"), 3);
  const screenshot = await send("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(path.join(profile, "dashboard.png"), Buffer.from(screenshot.data, "base64"));
  console.log("PASS registration, student login and dashboard MongoDB cards");
  const links = [["Events", "/events"], ["Academic Info", "/academic"], ["Library", "/library"], ["Campus Map", "/locations"], ["Profile", "/profile"]];
  for (const [label, route] of links) {
    await evaluate(`Array.from(document.querySelectorAll('nav a')).find(a => a.textContent.trim() === ${JSON.stringify(label)}).click()`);
    await until(`location.pathname === ${JSON.stringify(route)} && document.querySelector('h1') && !document.body.innerText.includes('Checking your session')`, label);
    if (route !== "/profile") await until("document.querySelectorAll('.campus-card').length > 0", label + " records");
  }
  console.log("PASS sidebar navigation and all campus list pages");
  await navigate("/locations"); await until("document.querySelector('.campus-search') && document.querySelectorAll('.campus-card').length > 0", "location search ready");
  await fill(".campus-search", "Computer Lab"); await until("document.querySelectorAll('.campus-card').length === 1", "location filtering");
  await navigate("/assistant"); await until("document.querySelector('.assistant-input-area input')", "assistant ready");
  await fill(".assistant-input-area input", "What are the library hours?"); await evaluate("document.querySelector('.assistant-input-area').requestSubmit()");
  await until("document.querySelector('.chat-transcript').innerText.includes('08:00')", "chat reply");
  await evaluate("Array.from(document.querySelectorAll('.assistant-topic-card')).find(el=>el.innerText.includes('Campus Events')).click()");
  await until("document.querySelectorAll('.chat-transcript .assistant-message').length >= 4 && !document.body.innerText.includes('Looking up campus information')", "suggested topic");
  console.log("PASS location search, assistant chat and suggested topics");
  await navigate("/admin-dashboard"); await until("location.pathname === '/student-dashboard'", "student blocked from admin");
  await until("document.querySelector('.logout-button')", "logout button");
  const oldToken = await evaluate("localStorage.getItem('token')");
  await evaluate("document.querySelector('.logout-button').click()"); await until("location.pathname === '/login' && !localStorage.getItem('token') && !localStorage.getItem('user')", "logout clears auth");
  const revoked = await fetch("http://localhost:5000/api/auth/me", { headers: { Authorization: `Bearer ${oldToken}` } }); assert.equal(revoked.status, 401);
  console.log("PASS student/admin restriction and logout revocation");
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  const user = await User.findOneAndUpdate({ email }, { role: "admin" }, { returnDocument: "after" }); userId = user._id;
  await login(); await until("location.pathname === '/admin-dashboard' && document.querySelectorAll('.admin-stat-card').length === 5 && document.querySelector('.admin-stat-grid').getAttribute('aria-busy') === 'false'", "admin overview login");
  const expected = await evaluate(`(async () => { const results = {}; for (const [key,list] of [['events','events'],['announcements','announcements'],['schedules','schedules'],['library','resources'],['locations','locations']]) { const response = await fetch('/api/' + key, {headers: {Authorization: 'Bearer ' + localStorage.getItem('token')}}); results[key] = (await response.json())[list].length; } return results; })()`);
  for (const [key,count] of Object.entries(expected)) assert.equal(await evaluate(`Number(document.querySelector('[data-stat="${key}"] > strong').innerText)`), count);
  const shot = async name => { await evaluate("window.scrollTo({top:0,behavior:'instant'})"); await delay(100); const result = await send("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(path.join(profile, name + ".png"), Buffer.from(result.data, "base64")); };
  await shot("admin-overview");
  await fill('.admin-search input', 'library'); await until("document.querySelectorAll('.admin-management-card').length === 1", "overview search"); await fill('.admin-search input', '');
  console.log("PASS admin login, API-backed overview counts and overview search");
  // Fail one request only in this browser to verify partial errors and retry.
  await evaluate(`window.__campusOriginalFetch = window.fetch; window.fetch = (url, options) => url === '/api/locations' ? Promise.resolve(new Response(JSON.stringify({message:'Temporary browser test failure'}), {status:503,headers:{'Content-Type':'application/json'}})) : window.__campusOriginalFetch(url, options); Array.from(document.querySelectorAll('.admin-text-button')).find(b => b.textContent.includes('Refresh data')).click()`);
  await until("document.querySelector('.admin-stat-grid').getAttribute('aria-busy') === 'true'", "overview loading state");
  await until("document.querySelector('[data-stat=locations] strong').textContent === 'Unavailable'", "partial API failure count");
  await evaluate("document.querySelector('.admin-nav-item[data-section=locations]').click()");
  await until("document.querySelector('.admin-load-error')?.textContent.includes('Temporary browser test failure')", "management API error state");
  await evaluate("window.fetch=window.__campusOriginalFetch; delete window.__campusOriginalFetch; document.querySelector('.admin-load-error button').click()");
  await until("document.querySelector('.admin-table') && document.querySelector('.admin-records-panel').getAttribute('aria-busy') === 'false'", "retry recovers");
  console.log("PASS loading, partial failure, unavailable count, error message and retry recovery");

  const day = new Date(Date.now() + 86400000).toISOString().slice(0,10);
  const samples = {
    events: { title: title + " events", description: "Browser event", date: day, time: "10:00 AM", location: "Hall A", category: "Workshop" },
    announcements: { title: title + " announcements", description: "Browser notice", category: "Demo", date: day },
    schedules: { subject: title + " schedules", date: day, startTime: "09:00", endTime: "10:00", location: "Hall B", type: "Lecture" },
    library: { title: title + " library", type: "Book", description: "Browser book", availability: "Available", location: "Shelf B" },
    locations: { name: title + " locations", building: "Demo Block", description: "Browser place", category: "Lab", openingHours: "08:00-17:00", directions: "First floor" }
  };
  for (const [key,values] of Object.entries(samples)) {
    await evaluate(`document.querySelector('.admin-nav-item[data-section="${key}"]').click()`);
    await until(`document.querySelector('.admin-nav-item[data-section="${key}"]').getAttribute('aria-current') === 'page' && document.querySelector('.admin-table')`, "admin " + key);
    const initial = expected[key];
    assert.equal(await evaluate("document.querySelectorAll('.admin-table tbody tr').length"), initial);
    await fill('.admin-search input', 'no-such-record-' + Date.now()); await until("document.body.innerText.includes('No matching records')", "search empty state"); await fill('.admin-search input', '');
    await evaluate("document.querySelector('.admin-management-heading .admin-primary-button').click()");
    await until("document.querySelector('.admin-form-panel')", "add form");
    const nameField = values.title ? 'title' : values.subject ? 'subject' : 'name';
    for (const [name,value] of Object.entries(values)) await fill('#admin-' + name, value);
    if (key === 'schedules') {
      await fill('#admin-endTime', '08:00'); await evaluate("document.querySelector('.admin-form-panel form').requestSubmit()"); await until("document.body.innerText.includes('End time must be after start time')", "schedule validation"); await fill('#admin-endTime', values.endTime);
    }
    if (key === 'announcements') await shot('admin-announcement-form');
    await evaluate("document.querySelector('.admin-form-panel form').requestSubmit()");
    await until(`document.querySelector('.admin-table')?.innerText.includes(${JSON.stringify(values[nameField])}) && !document.querySelector('.admin-form-panel')`, "admin add " + key);
    assert.equal(await evaluate(`Number(document.querySelector('.admin-nav-item[data-section="${key}"] small').innerText)`), initial + 1);
    await evaluate(`Array.from(document.querySelectorAll('.admin-table tbody tr')).find(r=>r.innerText.includes(${JSON.stringify(values[nameField])})).querySelector('.admin-edit-button').click()`);
    await until("document.querySelector('.admin-form-panel')", "edit form");
    assert.equal(await evaluate(`document.querySelector('#admin-${nameField}').value`), values[nameField]);
    await fill('#admin-' + nameField, values[nameField] + ' Updated'); await evaluate("document.querySelector('.admin-form-panel form').requestSubmit()");
    await until(`document.querySelector('.admin-table')?.innerText.includes(${JSON.stringify(values[nameField] + ' Updated')}) && !document.querySelector('.admin-form-panel')`, "admin update " + key);
    await evaluate(`window.confirm=()=>false; Array.from(document.querySelectorAll('.admin-table tbody tr')).find(r=>r.innerText.includes(${JSON.stringify(values[nameField])})).querySelector('.admin-delete-button').click()`);
    assert.equal(await evaluate("document.querySelectorAll('.admin-table tbody tr').length"), initial + 1);
    await evaluate(`window.confirm=()=>true; Array.from(document.querySelectorAll('.admin-table tbody tr')).find(r=>r.innerText.includes(${JSON.stringify(values[nameField])})).querySelector('.admin-delete-button').click()`);
    await until(`!document.querySelector('.admin-table')?.innerText.includes(${JSON.stringify(values[nameField])})`, "admin delete " + key);
    assert.equal(await evaluate(`Number(document.querySelector('.admin-nav-item[data-section="${key}"] small').innerText)`), initial);
    console.log('PASS ' + key + ': view, search, add, edit, cancel deletion, delete and counts');
  }
  await evaluate("document.querySelector('.admin-nav-item[data-section=events]').click(); document.querySelector('.admin-management-heading .admin-primary-button')?.click()");
  await until("document.querySelector('.admin-management-heading')", "events section");
  await evaluate("document.querySelector('.admin-management-heading .admin-primary-button').click()"); await until("document.querySelector('.admin-form-panel')", "cancel form");
  await evaluate("document.querySelector('.admin-form-footer .admin-secondary-button').click()"); await until("!document.querySelector('.admin-form-panel')", "cancel closes form");
  await shot('admin-events');
  await evaluate("document.querySelector('.admin-nav-item[data-section=overview]').click()"); await until("document.querySelectorAll('.admin-stat-card').length === 5", "overview");
  for (const width of [1024,768]) {
    await send('Emulation.setDeviceMetricsOverride', {width,height:1000,deviceScaleFactor:1,mobile:false});
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true, 'page overflow at ' + width);
    if (width === 768) { await evaluate("document.querySelector('.admin-menu-toggle').click()"); await until("document.querySelector('.admin-sidebar').classList.contains('is-open')", 'tablet menu'); await evaluate("document.querySelector('.admin-backdrop').click()"); }
    await shot('admin-' + width);
  }
  await send('Emulation.setDeviceMetricsOverride', {width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  console.log('PASS form cancellation, laptop/tablet layout and collapsible navigation');
  const adminToken = await evaluate("localStorage.getItem('token')");
  await evaluate("document.querySelector('.admin-logout').click()"); await until("location.pathname === '/login' && !localStorage.getItem('token') && !localStorage.getItem('user')", "admin logout");
  assert.equal((await fetch('http://localhost:5000/api/auth/me',{headers:{Authorization:'Bearer ' + adminToken}})).status,401);
  assert.deepEqual(errors, []);
  console.log("PASS admin list/add/edit/delete, admin logout and no browser runtime errors");
  console.log("Browser screenshots: " + profile);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  try { if (ws?.readyState === WebSocket.OPEN) { await send("Browser.close"); ws.close(); } } catch {} finally { browser?.kill(); }
  try {
    if (mongoose.connection.readyState !== 1) await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    const user = userId ? { _id: userId } : await User.findOne({ email });
    if (user) { await Session.deleteMany({ user: user._id }); await User.deleteOne({ _id: user._id }); }
    for (const [model, key, field] of [["event","events","title"],["Announcement","announcements","title"],["Schedule","schedules","subject"],["LibraryResource","library","title"],["CampusLocation","locations","name"]]) {
      await require("../models/" + model).deleteMany({ [field]: { $in: [title + " " + key, title + " " + key + " Updated"] } });
    }
  } finally { await mongoose.disconnect(); }
});
