type DeeplinkAction = (deeplink: string, params: Record<string, string>) => void;
type DeeplinkConfig = Record<string, { action: DeeplinkAction }>;

export const deeplinkConfig: DeeplinkConfig = {};

export const handleDeeplink = (deeplink: string) => {
  const config = deeplinkConfig[deeplink];
  if (!config?.action) throw new Error(`Deeplink ${deeplink} not found`);

  let params: Record<string, string> = {};

  try {
    const url = new URL(deeplink);
    params = Object.fromEntries([...url.searchParams.entries()]);
  } catch {}

  config.action(deeplink, params);
};
