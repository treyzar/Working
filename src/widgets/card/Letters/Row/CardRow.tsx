export function Row({
  label,
  value,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <div className="row g-2 align-items-start mb-2">
      <div className="col-12 col-sm-3 muted small text-uppercase">{label}</div>
      <div className="col-12 col-sm-9">{value}</div>
    </div>
  );
}
