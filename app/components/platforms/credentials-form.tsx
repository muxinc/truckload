import toast from 'react-hot-toast';

import useMigrationStore from '@/utils/store';
import type { PlatformCredentials } from '@/utils/store';

const PLATFORM_CREDENTIALS = [
  {
    name: 'Amazon S3',
    id: 's3',
    values: [
      {
        label: 'Access Key ID',
        name: 'publicKey',
        type: 'text',
      },
      {
        label: 'Secret Access Key',
        name: 'secretKey',
        type: 'text',
      },
      {
        label: 'Region',
        name: 'region',
        type: 'select',
        values: [
          'us-east-1',
          'us-west-1',
          'us-west-2',
          'eu-west-1',
          'eu-central-1',
          'ap-southeast-1',
          'ap-southeast-2',
          'ap-northeast-1',
          'sa-east-1',
        ],
      },
      {
        label: 'Bucket name',
        name: 'bucket',
        type: 'text',
      },
    ],
  },
  {
    name: 'Cloudflare Stream',
    id: 'cloudflare-stream',
    values: [
      {
        label: 'Account ID',
        name: 'publicKey',
        type: 'text',
      },
      {
        label: 'API Token',
        name: 'secretKey',
        type: 'text',
      },
    ],
  },
  {
    name: 'Mux',
    id: 'mux',
    values: [
      {
        label: 'Access Token ID',
        name: 'publicKey',
        type: 'text',
      },
      {
        label: 'Secret Key',
        name: 'secretKey',
        type: 'text',
      },
    ],
  },
];

export default function PlatformCredentialsForm() {
  const { currentStep, setCurrentStep, platform, setPlatform } = useMigrationStore((state) => ({
    currentStep: state.currentStep,
    setCurrentStep: state.setCurrentStep,
    setPlatform: state.setPlatform,
    platform: state.currentStep === 'set-source-credentials' ? state.sourcePlatform : state.destinationPlatform,
  }));

  if (!platform) {
    return null;
  }

  const platformCreds = PLATFORM_CREDENTIALS.find((p) => p.id === platform?.id);
  if (!platformCreds) {
    return null;
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const rawData = Object.fromEntries(formData.entries());
    const { publicKey, secretKey, ...additionalMetadata } = rawData as unknown as Record<string, string>;
    const data: PlatformCredentials = { publicKey, secretKey, additionalMetadata };

    const result = await fetch('/api/credentials', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (result.status === 401) {
      toast('Invalid credentials, try again', { icon: '❌' });
    }

    if (result.status === 200) {
      setPlatform(platform.type, { ...platform, credentials: data });
      if (currentStep === 'set-source-credentials') {
        setCurrentStep('set-video-filter');
      } else {
        setCurrentStep('set-import-settings');
      }

      toast('Credentials validated', { icon: '👍' });
    }
  };

  return (
    <div className="max-w-lg">
      <h2 className={`text-primary uppercase font-bold text-lg`}>Add your {platform.name} credentials</h2>
      <p className="text-xs">Only stored locally. Encrypted in transit.</p>

      <form onSubmit={onSubmit}>
        <input type="hidden" name="platformId" value={platform?.id} />

        {platformCreds.values.map((value) => (
          <div key={value.name} className="my-3">
            <label htmlFor={value.name} className="block text-sm font-medium leading-6 text-gray-900">
              {value.label}
            </label>

            <div className="mt-2">
              {value.type === 'text' && (
                <input
                  id={value.name}
                  name={value.name}
                  type="text"
                  required
                  className="block w-full rounded-md border-0 px-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              )}

              {value.type === 'select' && (
                <select
                  required
                  id={value.name}
                  name={value.name}
                  className="block w-full rounded-md border-0 px-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                >
                  {value.values?.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        ))}

        <div className="mt-6">
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Validate credentials
          </button>
        </div>
      </form>
    </div>
  );
}
