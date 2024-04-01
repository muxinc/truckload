import toast from 'react-hot-toast';
import useMigrationStore from '@/utils/store';
import Heading from './heading';

export default function Sidebar() {
  const sourcePlatform = useMigrationStore((state) => state.sourcePlatform);
  const setPlatform = useMigrationStore((state) => state.setPlatform);
  const destinationPlatform = useMigrationStore((state) => state.destinationPlatform);
  const setCurrentStep = useMigrationStore((state) => state.setCurrentStep);
  const currentStep = useMigrationStore((state) => state.currentStep);
  const assetFilter = useMigrationStore((state) => state.assetFilter);
  const setAssetFilter = useMigrationStore((state) => state.setAssetFilter);

  const state = useMigrationStore.getState();

  console.dir(state);

  const onSubmit = async () => {
    console.log({ sourcePlatform, destinationPlatform, assetFilter });
    const result = await fetch('/api/job', {
      method: 'POST',
      body: JSON.stringify({ sourcePlatform, destinationPlatform, assetFilter }),
    });

    if (result.status === 201) {
      const { id } = await result.json();
      useMigrationStore.setState({ job: { id, status: 'pending', progress: 0, videos: {} } });

      setCurrentStep('migration-status');
      toast('Migrationtext-xl text-primary uppercaseinitiated', { icon: '👍' });
    } else {
      toast.error('Error initiating migration');
    }
  };

  return (
    <div className="relative border-2 border-slate-200 rounded p-4 -mt-4">
      <Heading>Moving list</Heading>

      <div className="flex flex-col gap-4 mt-10 mb-16">
        {!sourcePlatform && (
          <p className="text-sm text-gray-600">
            This list will grow as you prepare your move.
            <br />
            Start over there ➡️
          </p>
        )}

        {sourcePlatform && (
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <div className="flex flex-col">
              <h3 className="font-semibold text-sm">Source platform</h3>
              <p className="text-sm">{sourcePlatform?.name}</p>
            </div>

            <button
              onClick={() => {
                setPlatform('source', null);
                setCurrentStep('select-source');
              }}
              className="text-3xl text-primary"
              aria-label={`Remove ${sourcePlatform?.name} as source platform`}
            >
              &times;
            </button>
          </div>
        )}

        {sourcePlatform?.credentials && (
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <div className="flex flex-col">
              <h3 className="font-semibold text-sm">Source credentials</h3>
              <p className="text-sm">Credentials added</p>
            </div>

            <button
              onClick={() => {
                setPlatform('source', { ...sourcePlatform, credentials: undefined });
                setCurrentStep('set-source-credentials');
              }}
            >
              ❌
            </button>
          </div>
        )}

        {assetFilter !== null && (
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <div className="flex flex-col">
              <h3 className="font-semibold text-sm">Video selection</h3>
              <p className="text-sm">Moving all videos</p>
            </div>

            <button
              onClick={() => {
                setAssetFilter(null);
                setCurrentStep('set-video-filter');
              }}
            >
              ❌
            </button>
          </div>
        )}

        {destinationPlatform && (
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <div className="flex flex-col">
              <h3 className="font-semibold text-sm">Destination platform</h3>
              <p className="text-sm">{destinationPlatform?.name}</p>
            </div>

            <button
              onClick={() => {
                setPlatform('destination', null);
                setCurrentStep('select-destination');
              }}
            >
              ❌
            </button>
          </div>
        )}

        {destinationPlatform?.credentials && (
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <div className="flex flex-col">
              <h3 className="font-semibold text-sm">Destination credentials</h3>
              <p className="text-sm">Credentials added</p>
            </div>

            <button
              onClick={() => {
                setPlatform('destination', { ...destinationPlatform, credentials: undefined });
                setCurrentStep('set-destination-credentials');
              }}
            >
              ❌
            </button>
          </div>
        )}

        {destinationPlatform?.config && (
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <div className="flex flex-col">
              <h3 className="font-semibold text-sm">Import settings</h3>
              <p className="text-sm">Settings added</p>
            </div>

            <button
              onClick={() => {
                setPlatform('destination', { ...destinationPlatform, config: undefined });
                setCurrentStep('set-import-settings');
              }}
            >
              ❌
            </button>
          </div>
        )}
      </div>

      {currentStep === 'review' && (
        <button
          className="font-sans uppercase rounded text-base bg-primary text-white py-4 px-8 font-semibold disabled:bg-gray-300 w-full"
          disabled={currentStep !== 'review'}
          onClick={onSubmit}
        >
          Place order
        </button>
      )}
    </div>
  );
}
