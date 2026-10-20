import taco from "@/features/vendor/assets/feed/Feed-taco.webp";
import fire from "@/features/vendor/assets/feed/Feed-fire.webp";
import sushi from "@/features/vendor/assets/feed/Feed-sushi.webp";
import burger from "@/features/vendor/assets/feed/Feed-burger.webp";

const artwork: Record<string, string> = {
  "🌮": taco,
  "🔥": fire,
  "🍣": sushi,
  "🍔": burger,
};
export function VendorFeedText({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/(🌮|🔥|🍣|🍔)/u)
        .map((part, index) =>
          artwork[part] ? (
            <img
              className="vendor-feed-emoji"
              src={artwork[part]}
              alt={part}
              key={index}
            />
          ) : (
            <span key={index}>{part}</span>
          ),
        )}
    </>
  );
}
