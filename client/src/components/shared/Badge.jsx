// Badge colours are brand-specific and not in the token set,
// so Tailwind arbitrary-value syntax is used for the custom palette.
const typeClass = {
  pdf:  'bg-[#F0997B33] text-[#993C1D]',
  docx: 'bg-[#85B7EB33] text-[#185FA5]',
  txt:  'bg-[#97C45933] text-[#3B6D11]',
};

export default function Badge({ type, children }) {
  return (
    <span
      data-testid="file-badge"
      className={`inline-block rounded-[3px] text-[11px] font-medium px-1.5 py-0.5 uppercase font-sans shrink-0 ${typeClass[type] ?? typeClass.txt}`}
    >
      {children}
    </span>
  );
}
