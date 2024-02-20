import { sriracha } from '@/_fonts';

const SOURCE_PLATFORM_CREDENTIALS = [
  {
    name: 'Amazon S3',
    slug: 's3',
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
    ],
  },
];
export default function SourcePlatformCredentialsForm() {
  return (
    <div className="my-4 max-w-lg">
      <h2 className={`text-primary uppercase font-bold text-lg ${sriracha.className}`}>Credentials</h2>
      <p className="text-xs">Never stored. Encrypted in transit.</p>

      {SOURCE_PLATFORM_CREDENTIALS.map((platform) => (
        <div>
          {platform.values.map((value) => (
            <div className="my-3">
              <label htmlFor={value.name} className="block text-sm font-medium leading-6 text-gray-900">
                {value.label}
              </label>
              <div className="mt-2">
                <input
                  id={value.name}
                  name={value.name}
                  type="text"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
