import { sriracha } from '@/_fonts';

export default function VideoFilter() {
  return (
    <div>
      <div className="mb-4">
        <h2 className={`text-primary uppercase font-bold text-lg ${sriracha.className}`}>Select your videos</h2>
        <p className="text-xs">What exactly do you want to transfer?</p>
      </div>

      <div className="flex gap-4">
        <button className="p-4 border-primary border-2 rounded text-slate-600 text-base h-28 w-56">
          Move everything. All of it.
        </button>
        <button className="text-gray-300 disabled">Let me choose which videos</button>
      </div>
    </div>
  );
}
