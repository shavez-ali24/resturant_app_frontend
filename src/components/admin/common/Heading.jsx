export default function Heading({ title, showDot = false }) {
  return (
    <div className="flex items-center gap-2 leading-none">
      {showDot && (
        <div className="relative flex h-2.5 w-2.5 shrink-0 items-center justify-center">
          <div className="absolute h-full w-full animate-ping rounded-full bg-green-400 opacity-40 dark:bg-green-300 dark:opacity-50" />
          <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)] dark:bg-green-400 dark:shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
        </div>
      )}
      <h3 className="text-xl font-bold tracking-tight text-[#1c1917] dark:text-slate-100 sm:text-2xl leading-none">
        {title}
      </h3>
    </div>
  );
}
