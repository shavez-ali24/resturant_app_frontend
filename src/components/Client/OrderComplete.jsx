import { Button } from "@/components/ui/button";

export default function OrderComplete({
  amount,
  buttonText,
  onClick,
  disabled,
  className,
}) {
  return (
    <div className="w-full">
      <Button
        className={className || "w-full bg-primary text-white rounded-full"}
        onClick={onClick}
        disabled={disabled}
      >
        {buttonText}
      </Button>
    </div>
  );
}
