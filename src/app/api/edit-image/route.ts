import { NextResponse } from "next/server";
import OpenAI from "openai";
import { writeFile } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

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

    // 一時ファイルとして保存
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 一時ディレクトリに保存
    const tempDir = join(process.cwd(), "tmp");
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

    // OpenAI APIを使用して画像を編集
    const response = await openai.images.edit({
      image: await openai.files.upload({
        file: filePath,
        purpose: "dall-e-3",
      }),
      prompt: prompt,
      n: 1,
      size: "1024x1024",
    });

    return NextResponse.json({ imageUrl: response.data[0].url });
  } catch (error) {
    console.error("OpenAI API エラー:", error);
    return NextResponse.json(
      { error: "画像の編集中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
