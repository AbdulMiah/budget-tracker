import { IconButton } from "@/components/IconButton";

/** Filter icon button; turns solid with a count badge when some accounts are filtered. */
export function AccountFilterButton({
  count,
  onPress,
}: {
  count: number;
  onPress: () => void;
}) {
  return (
    <IconButton
      icon="options-outline"
      count={count}
      accessibilityLabel={
        count ? `Filter accounts, ${count} selected` : "Filter accounts"
      }
      onPress={onPress}
    />
  );
}
