const { useState, useRef, useEffect } = React;

// استخدمنا v1beta والموديل فلاش لضمان التشغيل
const API_KEY = "AIzaSyDVJPw5sgJM8FV_FQMlDMIqgXwUwaMNkZo";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

const SYSTEM_PROMPT = "انت AI Edit Director مخرج ايدتات محترف. حلل الفيديو او الصورة وعطني فيدباك بالعربي. حدد العيوب بالتايمكود. اقترح SFX وميمز واوفرلايات. قيم من 10 كل عنصر الكتينج والتايمنج والافكتات والصوت. اختم بخطة تحرير خطوة بخطوة.";

function nowTime() {
  return new Date().toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" });
}

function formatText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");
}

function fileToBase64(file) {
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onload = function() { resolve(reader.result.split(",")[1]); };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// دالة اتصال مباشرة ومجربة
async function callAPI(parts) {
  var response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: parts }]
    })
  });
  
  var data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ? data.error.message : "خطأ في الاتصال");
  }
  return data.candidates[0].content.parts[0].text;
}

// باقي كود الـ UI (مختصر لضمان عمل الصفحة)
function App() {
  var s1 = useState([{ role: "ai", text: "مرحباً مهند! مخرج الإيدت جاهز. ارفع ملفك الحين.", time: nowTime() }]);
  var msgs = s1[0]; var setMsgs = s1[1];
  var s2 = useState(""); var txt = s2[0]; var setTxt = s2[1];
  var s3 = useState(null); var file = s3[0]; var setFile = s3[1];
  var s4 = useState(false); var loading = s4[0]; var setLoading = s4[1];
  var fileRef = useRef();

  async function send() {
    var t = txt.trim();
    if (!t && !file) return;
    setLoading(true);
    var userMsg = { role: "user", text: t, file: file, time: nowTime() };
    setMsgs(p => p.concat(userMsg));
    setTxt("");
    var currentFile = file;
    setFile(null);
    try {
      var parts = [{ text: SYSTEM_PROMPT }];
      if (currentFile) {
        var b64 = await fileToBase64(currentFile.raw);
        parts.push({ inline_data: { mime_type: currentFile.raw.type, data: b64 } });
      }
      if (t) parts.push({ text: t });
      var reply = await callAPI(parts);
      setMsgs(p => p.concat({ role: "ai", text: reply, time: nowTime() }));
    } catch (e) {
      setMsgs(p => p.concat({ role: "ai", text: "Error: " + e.message, time: nowTime() }));
    } finally {
      setLoading(false);
    }
  }

  return React.createElement("div", { className: "panel", style: { height: "100vh", padding: 20, display: "flex", flexDirection: "column", gap: 10 } },
    React.createElement("div", { style: { flex: 1, overflowY: "auto" } },
      msgs.map((m, i) => React.createElement("div", { key: i, style: { marginBottom: 15, textAlign: m.role === "user" ? "right" : "left" } }, 
        React.createElement("div", { dangerouslySetInnerHTML: { __html: formatText(m.text) }, style: { background: m.role === "user" ? "#00f5ff22" : "#bf00ff22", padding: 10, borderRadius: 10, display: "inline-block" } })
      ))
    ),
    loading && React.createElement("div", null, "جاري التحليل..."),
    React.createElement("input", { type: "file", ref: fileRef, onChange: e => setFile({raw: e.target.files[0]}) }),
    React.createElement("div", { style: { display: "flex", gap: 10 } },
      React.createElement("input", { value: txt, onChange: e => setTxt(e.target.value), style: { flex: 1, padding: 10 } }),
      React.createElement("button", { onClick: send }, "إرسال")
    )
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
