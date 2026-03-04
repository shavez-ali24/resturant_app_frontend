export default function Copywright() {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-20 border-t border-orange-100/80 bg-white px-2 py-1 text-center text-[11px] text-gray-600"
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom) + 4px)",
      }}
    >
      <p>
        © {new Date().getFullYear()}{" "}
        <a
          href="#"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Ezaazi Technologies
        </a>{" "}
        — All rights reserved.
      </p>
      <p>
        <a
          href="https://mail.google.com/mail/?view=cm&fs=1&to=shvzrn@gmail.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Email Us
        </a>
      </p>
    </div>
  );
}
