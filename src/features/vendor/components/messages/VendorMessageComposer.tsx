import {
  TextComposer,
  type TextComposerProps,
} from "@/features/messaging/components/TextComposer";
export function VendorMessageComposer(props: TextComposerProps) {
  return <TextComposer {...props} vendor />;
}
