import { useState } from 'react';

function SafeImage({ src, alt, ...rest }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="image-fallback" role="img" aria-label={alt || 'Image unavailable'}>
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
        <span>Image unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}

export default SafeImage;
