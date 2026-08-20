import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity, ArrowRight, Check, ChevronDown, CircleAlert, Clipboard,
  Clock3, Copy, Download, FileText, History, Languages, Loader2,
  Menu, Play, RotateCcw, Settings, Sparkles, Terminal, Trash2,
  WandSparkles, X, Zap
} from "lucide-react";
import "./styles.css";

const sampleText =
  "AI agents are the future of technology. They can perform tasks, make decisions, and even learn from experience. As AI agents become more advanced, they will revolutionize industries, enhance productivity, and improve our daily lives. However, it is crucial to ensure that these agents are designed ethically and responsibly to avoid potential risks and negative consequences.";

const stages = [
  { key: "editor", number: "01", title: "AI Editor", subtitle: "Clean & refine", icon: WandSparkles },
  { key: "scriptwriter", number: "02", title: "Scriptwriter", subtitle: "Make it engaging", icon: FileText },
  { key: "translator", number: "03", title: "Hinglish Localizer", subtitle: "Natural localization", icon: Languages }
];


function App() {
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState("final");
  const [stage, setStage] = useState("idle");
  const [outputs, setOutputs] = useState({ edited: "", script: "", final: "" });
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const words = useMemo(() => input.trim() ? input.trim().split(/\s+/).length : 0, [input]);
  const chars = input.length;

  const currentOutput = outputs[activeTab];

const runPipeline = async () => {
  if (!input.trim()) return;

  setOutputs({
    edited: "",
    script: "",
    final: ""
  });

  try {
    // Start pipeline
    setStage("editor");

    const response = await fetch("http://127.0.0.1:8000/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        raw_input: input
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      throw new Error(
        errorData.detail || `Backend returned ${response.status}`
      );
    }

    const data = await response.json();

    // ─────────────────────────────
    // Stage 1: Editor
    // ─────────────────────────────
    setStage("editor");

    setOutputs(prev => ({
      ...prev,
      edited: data.edited_text || ""
    }));

    await new Promise(resolve => setTimeout(resolve, 600));

    // ─────────────────────────────
    // Stage 2: Scriptwriter
    // ─────────────────────────────
    setStage("scriptwriter");

    setOutputs(prev => ({
      ...prev,
      script: data.script_text || ""
    }));

    await new Promise(resolve => setTimeout(resolve, 600));

    // ─────────────────────────────
    // Stage 3: Hinglish Translator
    // ─────────────────────────────
    setStage("translator");

    setOutputs(prev => ({
      ...prev,
      final: data.final_output || ""
    }));

    await new Promise(resolve => setTimeout(resolve, 400));

    // Pipeline finished
    setStage("done");
    setActiveTab("final");

  } catch (error) {
    console.error("Pipeline error:", error);

    setStage("idle");

    alert(
      `Could not connect to the backend.\n\n${error.message}`
    );
  }
};

  const clear = () => {
    setInput("");
    setOutputs({ edited: "", script: "", final: "" });
    setStage("idle");
  };

  const loadExample = () => setInput(sampleText);

  const copyOutput = async () => {
    if (!currentOutput) return;
    await navigator.clipboard?.writeText(currentOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const downloadOutput = () => {
    if (!currentOutput) return;
    const blob = new Blob([currentOutput], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scriptflow-${activeTab}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><Sparkles size={18} /></div>
          <div>
            <div className="brand-name">ScriptFlow <span>AI</span></div>
            <div className="brand-sub">LangGraph Content Pipeline</div>
          </div>
        </div>

        <nav className="nav-links">
          <button className="nav-active"><Terminal size={15}/> Workspace</button>
          <button><History size={15}/> History</button>
        </nav>

        <div className="top-actions">
          <div className="status-pill"><i /> System online</div>
          <button className="icon-button" onClick={() => setShowSettings(v => !v)} title="Settings">
            <Settings size={17}/>
          </button>
          <button className="avatar">SS</button>
        </div>
      </header>

      <main className="main">
        <section className="hero">
          <div>
            <div className="eyebrow"><Zap size={13}/> SEQUENTIAL AI WORKFLOW</div>
            <h1>Turn raw ideas into<br/><span>ready-to-use scripts.</span></h1>
            <p>Three specialized AI stages. One seamless LangGraph pipeline.</p>
          </div>
          <div className="stack-badges">
            <span>LangGraph</span>
            <span>Groq</span>
            <span>LLM Orchestration</span>
          </div>
        </section>

        <section className="workspace-grid">
          <div className="panel input-panel">
            <div className="panel-head">
              <div>
                <div className="panel-kicker">INPUT</div>
                <h2>Raw Content</h2>
              </div>
              <button className="ghost-button" onClick={clear}><Trash2 size={14}/> Clear</button>
            </div>

            <div className="editor-wrap">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Paste your article, notes, idea, or rough content here..."
                spellCheck="true"
              />
              {!input && (
                <div className="editor-hint">
                  <FileText size={18}/>
                  <span>Start with any rough text. The pipeline will refine and localize it.</span>
                </div>
              )}
            </div>

            <div className="editor-footer">
              <span>{words} words · {chars} characters</span>
              <button className="sample-button" onClick={loadExample}>Load example <ArrowRight size={13}/></button>
            </div>

            <button className="run-button" onClick={runPipeline} disabled={!input.trim() || stage !== "idle" && stage !== "done"}>
              {stage !== "idle" && stage !== "done" ? <Loader2 className="spin" size={18}/> : <Play size={17} fill="currentColor"/>}
              {stage !== "idle" && stage !== "done" ? "Running pipeline..." : "Run Pipeline"}
            </button>
          </div>

          <div className="panel pipeline-panel">
            <div className="panel-head">
              <div>
                <div className="panel-kicker">ORCHESTRATION</div>
                <h2>Pipeline Execution</h2>
              </div>
              <span className="sequential-badge"><Activity size={13}/> Sequential</span>
            </div>

            <div className="pipeline">
              {stages.map((item, index) => {
                const Icon = item.icon;
                const active = stage === item.key;
                const complete =
                  stage === "done" ||
                  (stage === "scriptwriter" && index === 0) ||
                  (stage === "translator" && index < 2);
                return (
                  <React.Fragment key={item.key}>
                    <div className={`stage-card ${active ? "active" : ""} ${complete ? "complete" : ""}`}>
                      <div className="stage-number">{item.number}</div>
                      <div className="stage-icon"><Icon size={19}/></div>
                      <div className="stage-copy">
                        <strong>{item.title}</strong>
                        <span>{item.subtitle}</span>
                      </div>
                      <div className="stage-status">
                        {active ? <Loader2 className="spin" size={16}/> : complete ? <Check size={16}/> : <span className="idle-dot"/>}
                      </div>
                    </div>
                    {index < stages.length - 1 && (
                      <div className={`connector ${complete ? "lit" : ""}`}><ArrowRight size={15}/></div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            <div className="pipeline-info">
              <div><span>MODEL</span><strong>openai/gpt-oss-20b</strong></div>
              <div><span>TEMPERATURE</span><strong>0.7</strong></div>
              <div><span>GRAPH</span><strong>3 nodes / 4 edges</strong></div>
            </div>

            <div className={`execution-state ${stage === "done" ? "success" : ""}`}>
              {stage === "done" ? <Check size={15}/> : <Activity size={15}/>}
              <span>{stage === "done" ? "Pipeline completed successfully" : "Ready to process input"}</span>
            </div>
          </div>
        </section>

        <section className="panel output-panel">
          <div className="panel-head output-head">
            <div>
              <div className="panel-kicker">RESULT</div>
              <h2>Generated Output</h2>
            </div>
            <div className="output-actions">
              <button className="ghost-button" disabled={!currentOutput} onClick={copyOutput}>
                {copied ? <Check size={14}/> : <Copy size={14}/>} {copied ? "Copied" : "Copy"}
              </button>
              <button className="ghost-button" disabled={!currentOutput} onClick={downloadOutput}>
                <Download size={14}/> Download
              </button>
            </div>
          </div>

          <div className="tabs">
            {[
              ["final", "Final Hinglish"],
              ["edited", "Edited Text"],
              ["script", "Video Script"]
            ].map(([key, label]) => (
              <button key={key} className={activeTab === key ? "tab-active" : ""} onClick={() => setActiveTab(key)}>
                {label}
              </button>
            ))}
          </div>

          <div className="output-area">
            {currentOutput ? (
              <p>{currentOutput}</p>
            ) : (
              <div className="empty-output">
                <div className="empty-icon"><Sparkles size={21}/></div>
                <strong>Your generated script will appear here</strong>
                <span>Run the pipeline to see each transformation stage come to life.</span>
              </div>
            )}
          </div>

          <div className="output-meta">
            <span><Clock3 size={13}/> {stage === "done" ? "Completed just now" : "No execution yet"}</span>
            <span><Activity size={13}/> {stage === "done" ? "3 / 3 nodes completed" : "Waiting for input"}</span>
            {stage === "done" && <span className="completed-label"><Check size={13}/> Success</span>}
          </div>
        </section>

        <section className="stats-row">
          <div className="stat"><span>PIPELINE</span><strong>3 Nodes</strong><small>Sequential execution</small></div>
          <div className="stat"><span>LLM</span><strong>Groq</strong><small>OpenAI GPT-OSS 20B</small></div>
          <div className="stat"><span>LOCALIZATION</span><strong>Hinglish</strong><small>Indian market optimized</small></div>
          <div className="stat"><span>FRAMEWORK</span><strong>LangGraph</strong><small>StateGraph orchestration</small></div>
        </section>
      </main>

      {showSettings && (
        <div className="settings-popover">
          <div className="settings-title"><span>Configuration</span><button onClick={() => setShowSettings(false)}><X size={16}/></button></div>
          <label>Content tone<select><option>Conversational</option><option>Professional</option><option>Educational</option><option>Energetic</option></select></label>
          <label>Output language<select><option>Hinglish</option><option>Hindi</option><option>English</option></select></label>
          <label>Format<select><option>YouTube Video</option><option>YouTube Short</option><option>Educational Script</option></select></label>
        </div>
      )}

      <footer className="footer">
        <span>ScriptFlow AI · Built with LangGraph</span>
        <span>Sequential LLM orchestration demo</span>
      </footer>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
