import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { prompt, model = "dall-e-3" } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "プロンプトが必要です" },
        { status: 400 }
      );
    }

    const response = await openai.images.generate({
      model: model,
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "hd"
    });

    return NextResponse.json({ imageUrl: response.data[0].url });
  } catch (error) {
    console.error("OpenAI API エラー:", error);
    return NextResponse.json(
      { error: "画像の生成中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
