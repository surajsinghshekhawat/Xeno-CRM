import {
  channelSendRequestSchema,
  channelSendResponseSchema,
  type ChannelSendRequest,
  type ChannelSendResponse,
} from "@xeno/shared";

export class ChannelStubError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ChannelStubError";
  }
}

function getStubUrl(): string {
  return process.env.CHANNEL_STUB_URL ?? "http://localhost:3002";
}

export async function sendCampaignToStub(
  payload: ChannelSendRequest,
): Promise<ChannelSendResponse> {
  const body = channelSendRequestSchema.parse(payload);
  const url = `${getStubUrl()}/send`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw new ChannelStubError("Channel service is currently unavailable", error);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new ChannelStubError(
      `Channel service rejected request (${response.status})${text ? `: ${text}` : ""}`,
    );
  }

  const json: unknown = await response.json();
  const parsed = channelSendResponseSchema.safeParse(json);

  if (!parsed.success) {
    throw new ChannelStubError("Channel service returned an invalid response");
  }

  return parsed.data;
}
