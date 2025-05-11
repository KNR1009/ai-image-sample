import { NextResponse } from "next/server";
import OpenAI from "openai";
import { writeFile, readFile } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs/promises";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File;
    const prompt = formData.get("prompt") as string;
    const model = (formData.get("model") as string) || "dall-e-2"; // 画像編集はDALL-E 2のみサポート

    if (!imageFile || !prompt) {
      return NextResponse.json(
        { error: "画像とプロンプトが必要です" },
        { status: 400 }
      );
    }

    // 一時ファイルとして保存
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 一時ディレクトリに保存
    const tempDir = join(process.cwd(), "tmp");

    // tmpディレクトリが存在しない場合は作成
    try {
      await fs.access(tempDir);
    } catch (error) {
      await fs.mkdir(tempDir, { recursive: true });
    }

    const filePath = join(tempDir, `${uuidv4()}-${imageFile.name}`);

    try {
      await writeFile(filePath, buffer);
    } catch (error) {
      console.error("ファイル保存エラー:", error);
      return NextResponse.json(
        { error: "ファイルの保存中にエラーが発生しました" },
        { status: 500 }
      );
    }

    try {
      // OpenAI APIを使用して画像を編集
      const fileBuffer = await readFile(filePath);

      // 画像編集APIを使用（DALL-E 2のみサポート）
      const response = await openai.images.edit({
        model: "dall-e-2", // 画像編集はDALL-E 2のみサポート
        image: fileBuffer,
        prompt: prompt,
        n: 1,
        size: "1024x1024",
      });

      // 一時ファイルを削除
      await fs.unlink(filePath).catch(err => console.error("一時ファイル削除エラー:", err));

      return NextResponse.json({ imageUrl: response.data[0].url });
    } catch (error) {
      // 一時ファイルを削除
      await fs.unlink(filePath).catch(err => console.error("一時ファイル削除エラー:", err));

      console.error("OpenAI API エラー:", error);

      // Few-shotアプローチとしてvariation APIを試す
      if (prompt.includes("この画像を参考にして")) {
        try {
          const fileBuffer = await readFile(filePath);

          // 画像生成APIを使用（DALL-E 3をサポート）
          const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: `以下の画像を参考にして新しい画像を生成してください: ${prompt}`,
            n: 1,
            size: "1024x1024",
          });

          return NextResponse.json({ imageUrl: response.data[0].url });
        } catch (secondError) {
          console.error("代替生成方法エラー:", secondError);
          return NextResponse.json(
            { error: "画像の編集中にエラーが発生しました。別の画像を試してください。" },
            { status: 500 }
          );
        }
      }

      return NextResponse.json(
        { error: "画像の編集中にエラーが発生しました" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("リクエスト処理エラー:", error);
    return NextResponse.json(
      { error: "リクエストの処理中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
