"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"prompt" | "image">("prompt");
  const [prompt, setPrompt] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePrompt, setImagePrompt] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePromptSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error("画像の生成に失敗しました");
      }

      const data = await response.json();
      setGeneratedImageUrl(data.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!imageFile || !imagePrompt.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("prompt", imagePrompt);

      const response = await fetch("/api/edit-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("画像の編集に失敗しました");
      }

      const data = await response.json();
      setGeneratedImageUrl(data.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>画像生成くん 🖼️</h1>
      </header>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "prompt" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("prompt")}
        >
          プロンプトから生成
        </button>
        <button
          className={`${styles.tab} ${activeTab === "image" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("image")}
        >
          画像から生成
        </button>
      </div>

      {activeTab === "prompt" ? (
        <div className={styles.inputSection}>
          <form onSubmit={handlePromptSubmit}>
            <textarea
              className={styles.textArea}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="例：美しい富士山の夕暮れ"
              required
            />
            <button type="submit" className={styles.button} disabled={isLoading}>
              {isLoading ? "生成中..." : "画像を生成する"}
            </button>
          </form>
        </div>
      ) : (
        <div className={styles.inputSection}>
          <form onSubmit={handleImageSubmit}>
            <div className={styles.fileUpload}>
              <input
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={handleFileChange}
                required
              />
              {imageFile && (
                <p>選択されたファイル: {imageFile.name}</p>
              )}
            </div>
            <textarea
              className={styles.textArea}
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              placeholder="例：この文字を「5つのヒント」に変更して"
              required
            />
            <button type="submit" className={styles.button} disabled={isLoading}>
              {isLoading ? "生成中..." : "編集画像を生成する"}
            </button>
          </form>
        </div>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}

      {generatedImageUrl && (
        <div className={styles.imageContainer}>
          <h2>生成された画像</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={generatedImageUrl}
            alt="生成された画像"
            className={styles.generatedImage}
          />
          <a
            href={generatedImageUrl}
            download="generated-image.png"
            className={styles.downloadButton}
          >
            ダウンロード
          </a>
        </div>
      )}

      <footer className={styles.footer}>
        <p>© 2023 画像生成くん - OpenAI DALL·E 3 APIを使用</p>
      </footer>
    </div>
  );
}
