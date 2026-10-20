import { Clock3 } from "lucide-react";
import {
  dropHours,
  dropMinutes,
  type CustomDropDuration,
} from "@/features/vendor/schemas/drops.schema";
import { formatCustomDropDuration } from "@/features/vendor/data/drops.data";

export function DropDurationPicker({
  value,
  onChange,
}: {
  value: CustomDropDuration;
  onChange: (value: CustomDropDuration) => void;
}) {
  return (
    <>
      <div className="drop-duration-picker">
        <fieldset>
          <legend>Hours</legend>
          <div className="drop-hour-options">
            {dropHours.map((hour) => (
              <button
                type="button"
                key={hour}
                aria-pressed={value.hours === hour}
                aria-label={`${hour} ${hour === 1 ? "hour" : "hours"}`}
                onClick={() => onChange({ ...value, hours: hour })}
              >
                {hour}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Minutes</legend>
          <div className="drop-minute-options">
            {dropMinutes.map((minute) => (
              <button
                type="button"
                key={minute}
                aria-pressed={value.minutes === minute}
                aria-label={`${minute} minutes`}
                onClick={() => onChange({ ...value, minutes: minute })}
              >
                :{String(minute).padStart(2, "0")}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
      <p className="drop-duration-summary" role="status">
        <Clock3 size={18} aria-hidden="true" />
        <strong>{formatCustomDropDuration(value)}</strong>
      </p>
    </>
  );
}
