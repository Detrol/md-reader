import { useEffect, useState, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import "highlight.js/styles/github-dark.css";
import "./App.css";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

function App() {
  const [content, setContent] = useState<string>("");
  const [filePath, setFilePath] = useState<string>("");
  const [darkMode, setDarkMode] = useState(() => {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [tocOpen, setTocOpen] = useState(true);

  const toc = useMemo((): TocItem[] => {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const items: TocItem[] = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");
      items.push({ id, text, level });
    }

    return items;
  }, [content]);

  useEffect(() => {
    async function loadInitialFile() {
      try {
        const initialPath = await invoke<string | null>("get_initial_file");
        if (initialPath) {
          loadFile(initialPath);
        }
      } catch (err) {
        console.error("Failed to get initial file:", err);
      }
    }
    loadInitialFile();
  }, []);

  async function loadFile(path: string) {
    try {
      const fileContent = await invoke<string>("read_file", { path });
      setContent(fileContent);
      setFilePath(path);
    } catch (err) {
      console.error("Failed to read file:", err);
      setContent("# Error\n\nFailed to load file: " + String(err));
    }
  }

  async function openFile() {
    try {
      const path = await invoke<string | null>("open_file_dialog");
      if (path) {
        loadFile(path);
      }
    } catch (err) {
      console.error("Failed to open file:", err);
    }
  }

  function scrollToHeading(id: string) {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }

  const fileName = filePath ? filePath.split(/[/\\]/).pop() : "";

  return (
    <div className={"app " + (darkMode ? "dark" : "light")}>
      <header className="header">
        <div className="header-left">
          <button onClick={openFile} className="btn btn-primary">
            Open File
          </button>
          {fileName && <span className="file-name">{fileName}</span>}
        </div>
        <div className="header-right">
          {toc.length > 0 && (
            <button
              onClick={() => setTocOpen(!tocOpen)}
              className="btn btn-icon"
              title="Toggle Table of Contents"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          )}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="btn btn-icon"
            title={darkMode ? "Light Mode" : "Dark Mode"}
          >
            {darkMode ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <div className="main-container">
        {toc.length > 0 && tocOpen && (
          <aside className="toc-sidebar">
            <h3>Contents</h3>
            <nav>
              <ul>
                {toc.map((item, index) => (
                  <li
                    key={index}
                    style={{ paddingLeft: (item.level - 1) * 12 + "px" }}
                  >
                    <button onClick={() => scrollToHeading(item.id)}>
                      {item.text}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        )}

        <main className={"content " + (!tocOpen || toc.length === 0 ? "full-width" : "")}>
          {content ? (
            <article className="markdown-body">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight, rehypeSlug]}
              >
                {content}
              </ReactMarkdown>
            </article>
          ) : (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <h2>MD Reader</h2>
              <p>Open a Markdown file to view its contents</p>
              <button onClick={openFile} className="btn btn-primary btn-large">
                Open Markdown File
              </button>
              <p className="hint">
                You can also double-click .md files to open them directly
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
