import { useMemo } from "react";
import { MoonStar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const swingKeyframes = `
@keyframes swing {
  0% { transform: rotate(3deg); }
  50% { transform: rotate(-3deg); }
  100% { transform: rotate(3deg); }
}
@keyframes ropeBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(2px); }
}`;

export default function RestaurantClosed({
  logo,
  siteName = "Restaurant",
  reopenAt,
}) {
  const hasLogo = Boolean(logo);

  const styleTag = useMemo(() => <style>{swingKeyframes}</style>, []);

  return (
    <>
      {styleTag}
      <div className="relative min-h-screen bg-gradient-to-br from-primary/5 via-white to-orange-50 flex items-center justify-center px-6 py-10 overflow-hidden">
        {/* Decorative blurred circles */}
        <div className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 right-0 h-72 w-72 rounded-full bg-orange-200/20 blur-3xl" />

        <div className="relative z-10 w-full max-w-xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl px-8 py-12 text-center flex flex-col items-center gap-6">
          {/* Hanging Closed Sign */}
          <div className="relative flex flex-col items-center mb-4">
            <div
              className="h-14 w-1 bg-gradient-to-b from-gray-200 via-gray-300 to-gray-400 rounded-full"
              style={{ animation: "ropeBounce 3s ease-in-out infinite" }}
            />
            <div
              className="mt-4 flex items-center justify-center rounded-2xl border border-dashed border-orange-200 bg-white/90 px-10 py-4 shadow-lg"
              style={{
                animation: "swing 4s ease-in-out infinite",
                transformOrigin: "top center",
              }}
            >
              <span className="text-xl font-semibold uppercase tracking-[0.4em] text-primary">
                Closed
              </span>
            </div>
          </div>

          {hasLogo ? (
            <div className="flex items-center justify-center h-20 w-20 rounded-2xl border border-orange-100 bg-white shadow-lg overflow-hidden">
              <img
                src={logo}
                alt={`${siteName} logo`}
                className="h-16 w-16 object-contain"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-20 w-20 rounded-2xl border border-orange-100 bg-white shadow-lg">
              <MoonStar className="h-10 w-10 text-primary" />
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.4em] text-primary/70">
              We&apos;re taking a short break
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              {siteName} is currently closed
            </h1>
            <p className="text-gray-600 text-base leading-relaxed max-w-lg mx-auto">
              We appreciate your visit! Orders are currently closed — please
              check again later.
            </p>
          </div>

          <div className="flex flex-col items-center gap-3">
            {reopenAt ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-700 font-medium text-sm">
                <Clock className="h-4 w-4" />
                Reopening at {reopenAt}
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-700 font-medium text-sm">
                <Clock className="h-4 w-4" />
                We&apos;ll be back soon
              </div>
            )}

            <Button
              size="lg"
              className="rounded-full px-8 py-6 text-base font-semibold bg-primary text-white shadow-lg hover:bg-primary/90 transition-all duration-200"
              onClick={() => window.location.reload()}
            >
              Refresh Status
            </Button>
          </div>

          <p className="text-xs text-gray-400 mt-6">
            We appreciate your patience and can&apos;t wait to serve you soon.
          </p>
        </div>
      </div>
    </>
  );
}
