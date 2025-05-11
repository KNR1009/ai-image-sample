"use client";

import { useState, FormEvent, ChangeEvent, useRef } from "react";
import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"prompt" | "image">("prompt");
  const [prompt, setPrompt] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<"dall-e-3" | "dall-e-2">("dall-e-3");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        body: JSON.stringify({ prompt, model }),
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

    if (!imageFile) {
      setError("画像をアップロードしてください");
      return;
    }

    if (!imagePrompt.trim()) {
      setError("プロンプトを入力してください");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("prompt", imagePrompt);
      formData.append("model", "dall-e-2"); // 画像編集はDALL-E 2のみサポート

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
      const file = e.target.files[0];
      setImageFile(file);

      // 画像プレビューの作成
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // 画像の説明を自動的にプロンプトに追加
      setImagePrompt(`この画像を参考にして、`);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.match('image.*')) {
        setImageFile(file);

        // 画像プレビューの作成
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // 画像の説明を自動的にプロンプトに追加
        setImagePrompt(`この画像を参考にして、`);
      }
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImagePrompt("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ローディングスピナーコンポーネント
  const LoadingSpinner = () => (
    <div className={styles.loadingOverlay}>
      <div className={styles.spinner}></div>
      <p className={styles.loadingText}>画像生成中...</p>
    </div>
  );

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
            <div className={styles.modelSelector}>
              <label htmlFor="model-select">モデル選択:</label>
              <select
                id="model-select"
                className={styles.select}
                value={model}
                onChange={(e) => setModel(e.target.value as "dall-e-3" | "dall-e-2")}
              >
                <option value="dall-e-3">DALL-E 3（高品質）</option>
                <option value="dall-e-2">DALL-E 2（標準）</option>
              </select>
            </div>
            <textarea
              className={styles.textArea}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="例：美しい富士山の夕暮れ"
              required
              disabled={isLoading}
            />
            <button type="submit" className={styles.button} disabled={isLoading}>
              {isLoading ? "生成中..." : "画像を生成する"}
            </button>
          </form>
        </div>
      ) : (
        <div className={styles.inputSection}>
          <form onSubmit={handleImageSubmit}>
            <div
              className={`${styles.dropZone} ${isLoading ? styles.disabled : ''}`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={isLoading ? undefined : triggerFileInput}
            >
              <input
                type="file"
                name="image"
                id="image-upload"
                accept=".jpg,.jpeg,.png"
                onChange={handleFileChange}
                ref={fileInputRef}
                className={styles.fileInput}
                disabled={isLoading}
                {...(!imageFile && { required: true })}
              />

              {imagePreview ? (
                <div className={styles.previewContainer}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="アップロードされた画像"
                    className={styles.imagePreview}
                  />
                  {!isLoading && (
                    <button
                      type="button"
                      className={styles.clearButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        clearImage();
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ) : (
                <div className={styles.dropZoneContent}>
                  <p>画像をドラッグ＆ドロップ</p>
                  <p>または</p>
                  <p>クリックして選択</p>
                </div>
              )}
            </div>

            {imageFile && (
              <p className={styles.fileName}>
                選択されたファイル: {imageFile.name}
              </p>
            )}

            <textarea
              className={styles.textArea}
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              placeholder="例：この画像を参考にして、文字を「5つのヒント」に変更して"
              required
              disabled={isLoading}
            />
            <p className={styles.helpText}>
              ヒント: 「この画像を参考にして、〜」と指定すると、アップロードした画像の特徴を活かした生成ができます
            </p>
            <button type="submit" className={styles.button} disabled={isLoading}>
              {isLoading ? "生成中..." : "編集画像を生成する"}
            </button>
          </form>
        </div>
      )}

      {error && <p className={styles.errorMessage}>{error}</p>}

      <div className={styles.resultContainer}>
        {isLoading && <LoadingSpinner />}

        {generatedImageUrl && (
          <div className={styles.imageContainer}>
            <h2>生成された画像</h2>
            <div className={styles.resultImageWrapper}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={generatedImageUrl}
                alt="生成された画像"
                className={styles.generatedImage}
              />
            </div>
            <a
              href={generatedImageUrl}
              download="generated-image.png"
              className={styles.downloadButton}
              target="_blank"
              rel="noopener noreferrer"
            >
              ダウンロード
            </a>
          </div>
        )}
      </div>

      <footer className={styles.footer}>
        <p>© 2023 画像生成くん - OpenAI DALL·E APIを使用</p>
      </footer>
    </div>
  );
}
