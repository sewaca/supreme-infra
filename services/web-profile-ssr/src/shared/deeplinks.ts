import { submitParentAgreement } from 'services/web-profile-ssr/app/profile/dormitory/action';

type DeeplinkAction = (deeplink: string, params: Record<string, string>) => void;
type DeeplinkActionAsync = (deeplink: string, params: Record<string, string>) => Promise<boolean>;
type DeeplinkConfig = Record<string, { action: DeeplinkAction } | { action: DeeplinkActionAsync }>;

export const deeplinkConfig: DeeplinkConfig = {
  'deeplink://dormitory/parent_agreement/upload_file': {
    action: (_deeplink, params) => {
      return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/pdf';
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) return reject(new Error('No file selected'));
          const applicationId = params.applicationId;

          const result = await submitParentAgreement({ file, applicationId }).catch(() => ({ success: false }));
          return resolve(result.success);
        };
        input.click();
      });
    },
  },
  'deeplink://common/download_file': {
    action: (_deeplink, params) => {
      return new Promise((resolve, reject) => {
        const fileUrl = params.fileUrl;
        if (!fileUrl) return reject(new Error('No fileUrl provided'));

        window.open(fileUrl, '_blank');

        resolve(true);
      });
    },
  },
};

export const handleDeeplink = async (deeplink: string) => {
  try {
    const deeplinkWithoutSearch = deeplink.split('?')[0];
    // validate remaining part
    new URL(deeplinkWithoutSearch);

    const config = deeplinkConfig[deeplinkWithoutSearch];
    if (!config?.action) throw new Error(`Deeplink ${deeplinkWithoutSearch} not found`);

    let params: Record<string, string> = {};

    try {
      const url = new URL(deeplink);
      params = Object.fromEntries([...url.searchParams.entries()]);
    } catch {}

    return await config.action(deeplink, params);
  } catch (e) {
    console.error(e);
    throw 'deeplink has incorect schema';
  }
};
