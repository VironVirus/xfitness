export type NotificationPayload = {
  memberId: string;
  heading: string;
  content: string;
  data?: Record<string, unknown>;
};

const oneSignalAppId = Deno.env.get("ONESIGNAL_APP_ID");
const oneSignalRestApiKey = Deno.env.get("ONESIGNAL_REST_API_KEY");

export async function sendOneSignalPush(payload: NotificationPayload) {
  if (!oneSignalAppId || !oneSignalRestApiKey) {
    throw new Error("OneSignal secrets are missing for this Edge Function.");
  }

  const response = await fetch("https://api.onesignal.com/notifications?c=push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${oneSignalRestApiKey}`
    },
    body: JSON.stringify({
      app_id: oneSignalAppId,
      target_channel: "push",
      include_aliases: {
        external_id: [payload.memberId]
      },
      headings: {
        en: payload.heading
      },
      contents: {
        en: payload.content
      },
      data: payload.data ?? {}
    })
  });

  if (!response.ok) {
    throw new Error(`OneSignal request failed with status ${response.status}.`);
  }

  return response.json();
}
