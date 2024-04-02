import useMigrationStore from '@/utils/store';
import Heading from '../heading';

export default function VideoFilter() {
  const setCurrentStep = useMigrationStore((state) => state.setCurrentStep);
  const setAssetFilter = useMigrationStore((state) => state.setAssetFilter);
  return (
    <div>
      <div className="mb-4">
        <Heading>Select your videos</Heading>
        <p className="text-xs">What exactly do you want to transfer?</p>
      </div>

      <div className="flex gap-4">
        <button
          className="p-4 border-2 rounded text-slate-600 border-slate-200 hover:border-slate-300 focus:border-slate-300 text-base h-28 w-56"
          onClick={() => {
            setAssetFilter([]);
            setCurrentStep('select-destination');
          }}
        >
          Move everything. All of it.
        </button>
        <button
          disabled
          className="p-4 border-2 rounded border-gray-300 text-gray-300 disabled:cursor-not-allowed text-base h-28 w-56"
        >
          Let me choose which videos
          <br />
          <span className="text-xs italic">Coming soon</span>
        </button>
      </div>
    </div>
  );
}
