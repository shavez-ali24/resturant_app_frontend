export default function Heading({ title }) {
    return (
        <div className="mb-1 flex items-center gap-2.5 leading-none">
            {/* Unique Stylized Dot */}
            <div className="relative flex h-3 w-3 items-center justify-center">
                <div className="absolute h-full w-full animate-ping rounded-full bg-orange-400 opacity-20" />
                <div className="h-2 w-2 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
            </div>
            
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl leading-none">
                {title}
            </h3>
        </div>
    )
}
