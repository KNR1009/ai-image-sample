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

    let size: string;
    let quality: string | undefined;
    let style: string | undefined;

    if (model === "dall-e-3") {
      size = "1024x1024";
      quality = "hd";
      style = "vivid";
    } else if (model === "dall-e-2" || model === "gpt-image-1") {
      size = "1024x1024";
    }

    const response = await openai.images.generate({
      model: model,
      prompt: prompt,
      n: 1,
      size: size,
      ...(quality && { quality }),
      ...(style && { style }),
      ...(model === "gpt-image-1" && { background: "transparent" })
    });

    console.log(response);

    const imageBase64 = response.data[0].b64_json;
    return NextResponse.json({ imageUrl: `data:image/png;base64,${imageBase64}` });
  } catch (error) {
    console.error("OpenAI API エラー:", error);
    return NextResponse.json(
      { error: "画像の生成中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
