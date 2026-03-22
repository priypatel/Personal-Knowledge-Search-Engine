// sm = 30 px, md = 32 px — expressed as Tailwind arbitrary sizes
const sizeClass = {
  sm: 'w-[30px] h-[30px]',
  md: 'w-8 h-8',
};

export default function Avatar({ initials, size = 'md' }) {
  return (
    <div
      data-testid="avatar"
      className={`${sizeClass[size] ?? sizeClass.md} rounded-token bg-primary text-white flex items-center justify-center text-xs font-medium uppercase font-sans shrink-0 select-none`}
    >
      {initials}
    </div>
  );
}
