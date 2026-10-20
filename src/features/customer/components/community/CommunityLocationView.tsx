import { ArrowLeft, MapPin } from "lucide-react";
import { useId, useState, type PointerEvent } from "react";
import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/ui/Button";
import mapImage from "@/features/customer/assets/discover/discover-map.png";

export type CommunityLocation = {
  city: string;
  radius: string;
  pin: { x: number; y: number };
};

export function CommunityLocationView({
  value,
  onApply,
  onBack,
}: {
  value: CommunityLocation;
  onApply: (value: CommunityLocation, asDefault: boolean) => void;
  onBack: () => void;
}) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState("");
  const id = useId();
  function move(event: PointerEvent<HTMLButtonElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    setDraft((current) => ({
      ...current,
      pin: {
        x: Math.max(0, Math.min(100, ((event.clientX - box.left) / box.width) * 100)),
        y: Math.max(0, Math.min(100, ((event.clientY - box.top) / box.height) * 100)),
      },
    }));
  }
  function apply(asDefault: boolean) {
    if (!draft.city.trim()) {
      setError("Enter a community city.");
      return;
    }
    onApply({ ...draft, city: draft.city.trim() }, asDefault);
  }
  return (
    <section className="community-location-view">
      <div className="community-page-heading">
        <Button aria-label="Back to Community" onClick={onBack}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1>Your location</h1>
          <p>Set your community area</p>
        </div>
      </div>
      <div className="community-form-panel">
        <button
          type="button"
          className="community-map"
          aria-label="Reposition sample location pin. Click, drag, or use arrow keys."
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            move(event);
          }}
          onPointerMove={(event) => {
            if (event.buttons === 1) move(event);
          }}
          onKeyDown={(event) => {
            const offsets: Record<string, [number, number]> = {
              ArrowLeft: [-2, 0],
              ArrowRight: [2, 0],
              ArrowUp: [0, -2],
              ArrowDown: [0, 2],
            };
            const delta = offsets[event.key];
            if (!delta) return;
            event.preventDefault();
            setDraft((current) => ({
              ...current,
              pin: {
                x: Math.max(0, Math.min(100, current.pin.x + delta[0])),
                y: Math.max(0, Math.min(100, current.pin.y + delta[1])),
              },
            }));
          }}
        >
          <img src={mapImage} alt="Sample San Francisco map from the design" />
          <span
            className="community-map-pin"
            style={{ left: `${draft.pin.x}%`, top: `${draft.pin.y}%` }}
          >
            <MapPin aria-hidden="true" size={38} fill="#FF5733" />
          </span>
        </button>
        <p className="my-5 text-center text-xs text-[#B8C1D1]">
          Drag pin to reposition · Arrow keys also move the sample pin
        </p>
        <FormField
          id={id}
          label="Community city"
          value={draft.city}
          onChange={(event) => setDraft({ ...draft, city: event.target.value })}
          error={error}
        />
        <fieldset className="mt-5">
          <legend className="mb-3 text-base font-semibold">Radius</legend>
          <div className="flex flex-wrap gap-3">
            {["10 mi", "25 mi", "50 mi", "Any"].map((radius) => (
              <label key={radius} className="cursor-pointer">
                <input
                  className="peer sr-only"
                  type="radio"
                  name={`${id}-radius`}
                  checked={draft.radius === radius}
                  onChange={() => setDraft({ ...draft, radius })}
                />
                <span className="community-choice">{radius}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <p className="mt-4 text-xs text-[#B8C1D1]">
          Radius and pin are local preferences. Sample posts are filtered by city; live
          distance data is not connected.
        </p>
        <Button className="community-primary mt-9 w-full" onClick={() => apply(false)}>
          Apply
        </Button>
        <Button className="mt-3 w-full" onClick={() => apply(true)}>
          Set as my default (this session)
        </Button>
      </div>
    </section>
  );
}
