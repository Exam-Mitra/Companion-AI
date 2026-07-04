export default function ProgressBar({ step, total }) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '20px 24px 0' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: 4,
            borderRadius: 4,
            background: i < step ? 'var(--sage-dark)' : 'var(--track-inactive)',
          }}
        />
      ))}
    </div>
  );
}
