import { useState, useCallback, useEffect } from "react";
import {
  Tldraw,
  Editor,
  TLStoreSnapshot,
  getSnapshot,
  loadSnapshot,
} from "tldraw";
import "tldraw/tldraw.css";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { Sidebar } from "./components/Sidebar";
import "./App.css";

interface AppState {
  projectPath: string | null;
  currentFilePath: string | null;
  currentFileName: string | null;
  isDirty: boolean;
}

function App() {
  const [state, setState] = useState<AppState>({
    projectPath: null,
    currentFilePath: null,
    currentFileName: null,
    isDirty: false,
  });
  const [editor, setEditor] = useState<Editor | null>(null);
  const [sidebarCollapsed] = useState(false);

  // Open folder as project
  const handleOpenFolder = useCallback(async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Open Project Folder",
    });

    if (selected && typeof selected === "string") {
      setState((prev) => ({
        ...prev,
        projectPath: selected,
        currentFilePath: null,
        currentFileName: null,
        isDirty: false,
      }));
      // Reset editor if exists
      if (editor) {
        const allShapeIds = editor.getCurrentPageShapeIds();
        if (allShapeIds.size > 0) {
          editor.deleteShapes([...allShapeIds]);
        }
      }
    }
  }, [editor]);

  // Open a file from the sidebar
  const handleOpenFile = useCallback(
    async (filePath: string) => {
      if (!editor) return;

      try {
        const content = await readTextFile(filePath);
        const snapshot = JSON.parse(content) as TLStoreSnapshot;
        loadSnapshot(editor.store, snapshot);
        const fileName = filePath.split("/").pop() || "untitled.tldr";
        setState((prev) => ({
          ...prev,
          currentFilePath: filePath,
          currentFileName: fileName,
          isDirty: false,
        }));
      } catch (error) {
        console.error("Failed to open file:", error);
      }
    },
    [editor]
  );

  // Save current drawing to file
  const handleSave = useCallback(async () => {
    if (!editor || !state.currentFilePath) return;

    try {
      const snapshot = getSnapshot(editor.store);
      const content = JSON.stringify(snapshot, null, 2);
      await writeTextFile(state.currentFilePath, content);
      setState((prev) => ({ ...prev, isDirty: false }));
    } catch (error) {
      console.error("Failed to save file:", error);
    }
  }, [editor, state.currentFilePath]);

  // Save As - save to a new file
  const handleSaveAs = useCallback(async () => {
    if (!editor || !state.projectPath) return;

    const filePath = await save({
      defaultPath: state.projectPath,
      filters: [{ name: "tldraw Drawing", extensions: ["tldr"] }],
      title: "Save Drawing As",
    });

    if (filePath) {
      try {
        const snapshot = getSnapshot(editor.store);
        const content = JSON.stringify(snapshot, null, 2);
        const finalPath = filePath.endsWith(".tldr")
          ? filePath
          : `${filePath}.tldr`;
        await writeTextFile(finalPath, content);

        const fileName = finalPath.split("/").pop() || "untitled.tldr";
        setState((prev) => ({
          ...prev,
          currentFilePath: finalPath,
          currentFileName: fileName,
          isDirty: false,
        }));
      } catch (error) {
        console.error("Failed to save file:", error);
      }
    }
  }, [editor, state.projectPath]);

  // Create new drawing
  const handleNewDrawing = useCallback(async () => {
    if (!editor || !state.projectPath) return;

    const filePath = await save({
      defaultPath: state.projectPath,
      filters: [{ name: "tldraw Drawing", extensions: ["tldr"] }],
      title: "Create New Drawing",
    });

    if (filePath) {
      try {
        // Clear the editor
        const allShapeIds = editor.getCurrentPageShapeIds();
        if (allShapeIds.size > 0) {
          editor.deleteShapes([...allShapeIds]);
        }

        // Save empty drawing
        const snapshot = getSnapshot(editor.store);
        const content = JSON.stringify(snapshot, null, 2);
        const finalPath = filePath.endsWith(".tldr")
          ? filePath
          : `${filePath}.tldr`;
        await writeTextFile(finalPath, content);

        const fileName = finalPath.split("/").pop() || "untitled.tldr";
        setState((prev) => ({
          ...prev,
          currentFilePath: finalPath,
          currentFileName: fileName,
          isDirty: false,
        }));
      } catch (error) {
        console.error("Failed to create new drawing:", error);
      }
    }
  }, [editor, state.projectPath]);

  // Track changes to mark as dirty
  const handleEditorMount = useCallback((editorInstance: Editor) => {
    setEditor(editorInstance);

    // Listen for changes
    editorInstance.store.listen(
      () => {
        setState((prev) => {
          if (prev.currentFilePath && !prev.isDirty) {
            return { ...prev, isDirty: true };
          }
          return prev;
        });
      },
      { source: "user", scope: "document" }
    );
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (state.currentFilePath) {
          handleSave();
        } else if (state.projectPath) {
          handleSaveAs();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "o") {
        e.preventDefault();
        handleOpenFolder();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "n" && !e.shiftKey) {
        e.preventDefault();
        if (state.projectPath) {
          handleNewDrawing();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    state.currentFilePath,
    state.projectPath,
    handleSave,
    handleSaveAs,
    handleOpenFolder,
    handleNewDrawing,
  ]);

  const projectName = state.projectPath?.split("/").pop() || null;

  return (
    <div className="app">
      <div className="main-content">
        {/* Sidebar */}
        <Sidebar
          projectPath={state.projectPath}
          projectName={projectName}
          currentFilePath={state.currentFilePath}
          isDirty={state.isDirty}
          isCollapsed={sidebarCollapsed}
          onOpenFolder={handleOpenFolder}
          onOpenFile={handleOpenFile}
          onNewDrawing={handleNewDrawing}
        />

        {/* Canvas */}
        <main className="canvas-container">
          {state.projectPath ? (
            <Tldraw onMount={handleEditorMount} />
          ) : (
            <div className="welcome-screen">
              <h1>Welcome to Desketch</h1>
              <p>A local-first drawing app powered by tldraw</p>
              <button className="primary-btn" onClick={handleOpenFolder}>
                Open Project Folder
              </button>
              <div className="shortcuts">
                <p>
                  <kbd>Ctrl+O</kbd> Open Folder
                </p>
                <p>
                  <kbd>Ctrl+N</kbd> New Drawing
                </p>
                <p>
                  <kbd>Ctrl+S</kbd> Save
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Status Bar */}
      <footer className="status-bar">
        <span className="status-file">
          {state.currentFileName
            ? `${state.currentFileName}${state.isDirty ? " *" : ""}`
            : "No file open"}
        </span>
        <span className="status-project">
          {projectName ? `Project: ${projectName}` : ""}
        </span>
        <span className="status-indicator">
          {state.isDirty ? "Unsaved changes" : state.currentFilePath ? "Saved ✓" : ""}
        </span>
      </footer>
    </div>
  );
}

export default App;
