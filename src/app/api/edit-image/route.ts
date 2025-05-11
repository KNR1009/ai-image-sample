import { NextResponse } from "next/server";
import OpenAI from "openai";
import { writeFile } from "fs/promises";
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

    if (!imageFile || !prompt) {
      return NextResponse.json(
        { error: "画像とプロンプトが必要です" },
        { status: 400 }
      );
    }

    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tempDir = join(process.cwd(), "tmp");

    try {
      await fs.access(tempDir);
    } catch {
      await fs.mkdir(tempDir, { recursive: true });
    }

    const filePath = join(tempDir, `${uuidv4()}-${imageFile.name}`);
    await writeFile(filePath, buffer);

    try {
      const response = await openai.images.generate({
        model: "gpt-image-1",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        background: "transparent",
      });

      console.log("OpenAI API Response:", response); // レスポンスをコンソールに出力

      const imageBase64 = response.data[0].b64_json;

      await fs.unlink(filePath).catch(err => console.error("一時ファイル削除エラー:", err));

      return NextResponse.json({ imageUrl: `data:image/png;base64,${imageBase64}` });
    } catch (error) {
      await fs.unlink(filePath).catch(err => console.error("一時ファイル削除エラー:", err));
      console.error("OpenAI API エラー:", error);
      return NextResponse.json(
        { error: "画像の生成中にエラーが発生しました" },
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
