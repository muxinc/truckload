import toast from 'react-hot-toast';

import { sriracha } from '@/_fonts';

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

export default function PlatformCredentialsForm({ platformId }: { platformId: string }) {
  const platform = PLATFORM_CREDENTIALS.find((p) => p.id === platformId);
  if (!platform) {
    return null;
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    console.log(data);

    const result = await fetch('/api/credentials', {
      method: 'POST',
      body: JSON.stringify({ data }),
    });

    if (result.status === 401) {
      toast('Invalid credentials, try again', { icon: '❌' });
    }

    if (result.status === 200) {
      toast('Credentials validated', { icon: '👍' });
    }
  };

  return (
    <div className="my-4 max-w-lg">
      <h2 className={`text-primary uppercase font-bold text-lg ${sriracha.className}`}>Add your credentials</h2>
      <p className="text-xs">Never stored. Encrypted in transit.</p>

      <form onSubmit={onSubmit}>
        {platform.values.map((value) => (
          <div key={value.name} className="my-3">
            <input type="hidden" name="platformId" value={platformId} />
            <label htmlFor={value.name} className="block text-sm font-medium leading-6 text-gray-900">
              {value.label}
            </label>
            <div className="mt-2">
              {value.type === 'text' && (
                <input
                  id={value.name}
                  name={value.name}
                  type="text"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              )}

              {value.type === 'select' && (
                <select
                  id={value.name}
                  name={value.name}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
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
