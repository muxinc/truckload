import { sriracha } from '@/_fonts';
import LogoS3 from '@/components/platforms/s3/logo';

const SOURCE_PLATFORMS = [
  {
    name: 'Amazon S3',
    description:
      'Amazon S3 is an object storage service that offers industry-leading scalability, data availability, security, and performance.',
    logo: LogoS3,
  },
];

export default function SourcePlatformList() {
  return (
    <div>
      <h2 className={`text-xl text-primary uppercase ${sriracha.className}`}>Select a source</h2>
      <p className="text-xs mb-4">Select the platform where your videos are currently stored</p>

      <div className="grid grid-cols-3">
        {SOURCE_PLATFORMS.map((platform) => (
          <div
            key={platform.name}
            className={`shadow rounded p-5 flex flex-col items-center cursor-pointer border-2 border-primary w-40 h-40`}
          >
            <div className="h-20 w-20 flex items-center justify-center">
              <platform.logo />
            </div>

            <h3 className="font-semibold text-slate-700 text-sm">{platform.name}</h3>
            {/* <p className='text-sm'>{platform.description}</p> */}
          </div>
        ))}
      </div>
    </div>
  );
}
