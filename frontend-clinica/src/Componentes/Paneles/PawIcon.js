export default function PawIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor" className={className} aria-hidden="true">
      <ellipse cx="11" cy="29" rx="7" ry="10" transform="rotate(-20 11 29)" />
      <ellipse cx="25" cy="15" rx="7" ry="11" transform="rotate(-8 25 15)" />
      <ellipse cx="41" cy="15" rx="7" ry="11" transform="rotate(8 41 15)" />
      <ellipse cx="55" cy="29" rx="7" ry="10" transform="rotate(20 55 29)" />
      <path d="M32 30c-9 0-18 9-18 17 0 6 5 9 11 9 3 0 5-1 7-1s4 1 7 1c6 0 11-3 11-9 0-8-9-17-18-17z" />
    </svg>
  );
}