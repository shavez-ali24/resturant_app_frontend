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
        className={
          className ||
          "w-full rounded-xl bg-primary py-2.5 text-base font-semibold text-white shadow-[0_10px_20px_rgba(249,115,22,0.28)] transition-all duration-200 hover:bg-primary/90 hover:shadow-[0_14px_26px_rgba(249,115,22,0.34)]"
        }
        onClick={onClick}
        disabled={disabled}
      >
        {buttonText}
      </Button>
    </div>
  );
}
