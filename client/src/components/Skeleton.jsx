function Skeleton({ className = '', rows = 1 }) {
  if (rows === 1) {
    return <div className={`skeleton ${className}`.trim()} />;
  }

  return (
    <div className="skeleton-group">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className={`skeleton skeleton--line ${index === rows - 1 ? 'skeleton--line-short' : ''} ${className}`.trim()}
        />
      ))}
    </div>
  );
}

export default Skeleton;
