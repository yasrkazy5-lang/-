const { useState, useRef, useEffect } = React;

// إعدادات المفتاح والرابط المستقر
const API_KEY = "AIzaSyDVJPw5sgJM8FV_FQMlDMIqgXwUwaMNkZo";
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

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

// دالة الاتصال المصلحة 100%
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
    throw new Error(data.error ? data.error.message : "خطأ في الاتصال بالسيرفر");
  }
  return data.candidates[0].content.parts[0].text;
}

function Dots() {
  return React.createElement("div", {
    style: { padding: "14px 18px", background: "var(--card2)", border: "1px solid rgba(191,0,255,0.2)", borderRadius: "4px 18px 18px 18px", display: "inline-flex", alignItems: "center", gap: 10 }
  },
    React.createElement("span", { style: { fontSize: 13 } }, "🎬"),
    React.createElement("div", { style: { fontSize: 11, color: "var(--muted)" } }, "يراجع اللقطات..."),
    React.createElement("div", { style: { display: "flex", gap: 5 } },
      React.createElement("span", { className: "typing-dot" }),
      React.createElement("span", { className: "typing-dot" }),
      React.createElement("span", { className: "typing-dot" })
    )
  );
}

function Bubble(props) {
  var msg = props.msg;
  var me = msg.role === "user";
  return React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: me ? "flex-end" : "flex-start", gap: 5 } },
    msg.file && React.createElement("div", { style: { maxWidth: "70%" } },
      msg.file.isImage
        ? React.createElement("img", { src: msg.file.preview, alt: "file", style: { maxHeight: 170, borderRadius: 12, border: "1px solid rgba(0,245,255,0.3)" } })
        : React.createElement("div", { className: "file-badge", style: { padding: "10px 14px", display: "flex", gap: 10, alignItems: "center" } },
            React.createElement("span", { style: { fontSize: 22 } }, "🎬"),
            React.createElement("div", null,
              React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--cyan)" } }, msg.file.name),
              React.createElement("div", { style: { fontSize: 11, color: "var(--muted)" } }, msg.file.size)
            )
          )
    ),
    msg.text && React.createElement("div", {
      className: me ? "msg-user" : "msg-ai",
      style: { maxWidth: "78%", padding: "12px 16px" }
    },
      me
        ? React.createElement("p", { style: { fontSize: 14, lineHeight: 1.7 } }, msg.text)
        : React.createElement("div", { className: "ai-response", style: { fontSize: 13.5, lineHeight: 1.85 }, dangerouslySetInnerHTML: { __html: formatText(msg.text) } })
    ),
    React.createElement("div", { style: { fontSize: 11, color: "var(--muted)", padding: "0 4px" } },
      (me ? "🎮 أنت" : "🎬 AI") + " · " + msg.time
    )
  );
}

function App() {
  var s1 = useState([{ role: "ai", text: "مرحباً! أنا AI Edit Director. ارفع فيديو أو صورة وابدأ الحديث.", time: nowTime() }]);
  var msgs = s1[0]; var setMsgs = s1[1];
  var s2 = useState(""); var txt = s2[0]; var setTxt = s2[1];
  var s3 = useState(null); var file = s3[0]; var setFile = s3[1];
  var s4 = useState(false); var loading = s4[0]; var setLoading = s4[1];
  var endRef = useRef();
  var fileRef = useRef();

  useEffect(function() {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  function pickFile(f) {
    if (!f) return;
    var isImage = f.type.startsWith("image/");
    setFile({ raw: f, isImage: isImage, preview: isImage ? URL.createObjectURL(f) : null, name: f.name, size: (f.size / 1024 / 1024).toFixed(2) + " MB" });
  }

  async function send() {
    var t = txt.trim();
    if (!t && !file) return;
    if (loading) return;
    var userMsg = { role: "user", text: t, file: file, time: nowTime() };
    setMsgs(function(p) { return p.concat([userMsg]); });
    setTxt("");
    var currentFile = file;
    setFile(null);
    setLoading(true);
    try {
      var parts = [{ text: SYSTEM_PROMPT }];
      if (currentFile) {
        var b64 = await fileToBase64(currentFile.raw);
        parts.push({ inline_data: { mime_type: currentFile.raw.type, data: b64 } });
      }
      if (t) parts.push({ text: t });
      var reply = await callAPI(parts);
      setMsgs(function(p) { return p.concat([{ role: "ai", text: reply, time: nowTime() }]); });
    } catch (e) {
      setMsgs(function(p) { return p.concat([{ role: "ai", text: "خطأ: " + e.message, time: nowTime() }]); });
    } finally {
      setLoading(false);
    }
  }

  function onKey(e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }

  return React.createElement("div", { style: { height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" } },
    React.createElement("header", { className: "header-bar", style: { padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 } },
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12 } },
        React.createElement("div", { style: { position: "relative", overflow: "hidden", width: 42, height: 42, borderRadius: 11, background: "linear-gradient(135deg,rgba(0,245,255,0.2),rgba(191,0,255,0.3))", border: "1px solid rgba(0,245,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 } },
          "🎬", React.createElement("div", { className: "scan-line" })
        ),
        React.createElement("div", null,
          React.createElement("div", { className: "glitch", style: { fontWeight: 900, fontSize: 17 } },
            React.createElement("span", { style: { color: "var(--cyan)" } }, "AI "),
            React.createElement("span", { style: { color: "var(--text)" } }, "Edit Director")
          ),
          React.createElement("div", { style: { fontSize: 11, color: "var(--muted)" } }, "مخرج الإيدت الذكي")
        )
      ),
      React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center" } },
        React.createElement("div", { className: "tag" }, "GEMINI 1.5"),
        React.createElement("div", { style: { width: 7, height: 7, borderRadius: "50%", background: "#00ff88", boxShadow: "0 0 8px #00ff88" } }),
        React.createElement("span", { style: { fontSize: 11, color: "#00ff88", fontWeight: 700 } }, "LIVE")
      )
    ),
    React.createElement("div", { style: { flex: 1, display: "flex", overflow: "hidden", padding: 14, gap: 14 } },
      React.createElement("div", { className: "desktop-only", style: { width: 300, flexShrink: 0, display: "flex", flexDirection: "column" } },
        React.createElement("div", { className: "panel", style: { padding: 18, display: "flex", flexDirection: "column", gap: 14, height: "100%" } },
          React.createElement("div", { style: { fontWeight: 700, fontSize: 14 } }, "🎬 رفع الفيديو / الصورة"),
          React.createElement("div", {
            className: "upload-zone",
            style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, minHeight: 160, cursor: "pointer" },
            onClick: function() { fileRef.current.click(); }
          },
            file
              ? React.createElement("div", { style: { textAlign: "center" } },
                  file.isImage
                    ? React.createElement("img", { src: file.preview, style: { maxHeight: 180, maxWidth: "100%", borderRadius: 10, border: "1px solid rgba(0,245,255,0.3)" } })
                    : React.createElement("div", null,
                        React.createElement("div", { style: { fontSize: 44 } }, "🎞️"),
                        React.createElement("div", { style: { fontSize: 12, color: "var(--cyan)", marginTop: 6 } }, file.name)
                      ),
                  React.createElement("div", { style: { fontSize: 11, color: "var(--muted)", marginTop: 8 } }, "اضغط لاستبدال")
                )
              : React.createElement("div", { style: { textAlign: "center" } },
                  React.createElement("div", { style: { fontSize: 46, filter: "drop-shadow(0 0 16px rgba(0,245,255,0.5))" } }, "📁"),
                  React.createElement("div", { style: { fontWeight: 700, fontSize: 13, color: "var(--cyan)", marginTop: 8 } }, "اسحب الملف هنا"),
                  React.createElement("div", { style: { fontSize: 11, color: "var(--muted)", marginTop: 4 } }, "أو اضغط للاختيار")
                )
          ),
          React.createElement("input", { ref: fileRef, type: "file", accept: "video/*,image/*", style: { display: "none" }, onChange: function(e) { pickFile(e.target.files[0]); } }),
          file && React.createElement("button", { className: "btn-neon", style: { padding: "7px", borderRadius: 9, fontSize: 12 }, onClick: function() { setFile(null); } }, "✕ حذف المرفق")
        )
      ),
      React.createElement("div", { className: "panel", style: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" } },
        React.createElement("div", { style: { padding: "12px 18px", borderBottom: "1px solid var(--border)", flexShrink: 0, display: "flex", alignItems: "center", gap: 10 } },
          React.createElement("span", { style: { fontSize: 18 } }, "💬"),
          React.createElement("div", null,
            React.createElement("div", { style: { fontWeight: 700, fontSize: 14 } }, "غرفة التحليل")
          )
        ),
        React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 18 } },
          msgs.map(function(m, i) { return React.createElement(Bubble, { key: i, msg: m }); }),
          loading && React.createElement(Dots),
          React.createElement("div", { ref: endRef })
        ),
        React.createElement("div", { style: { padding: "12px 14px", borderTop: "1px solid var(--border)", display: "flex", gap: 9, alignItems: "flex-end", flexShrink: 0 } },
          React.createElement("textarea", {
            className: "chat-input",
            value: txt,
            onChange: function(e) { setTxt(e.target.value); },
            onKeyDown: onKey,
            placeholder: "اسأل AI Edit Director...",
            rows: 1
          }),
          React.createElement("button", {
            className: "btn-send",
            onClick: send,
            disabled: loading || (!txt.trim() && !file),
            style: { width: 40, height: 40, borderRadius: 9, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }
          }, loading ? "..." : "⚡")
        )
      )
    )
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));

