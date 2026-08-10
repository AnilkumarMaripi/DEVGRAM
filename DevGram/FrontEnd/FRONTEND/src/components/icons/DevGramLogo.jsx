function DevGramLogo({ className = 'brand-icon', size = 36 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        {/* Diagonal Gradient: Left-Bottom to Right-Top */}
        <linearGradient id="devgram-logo-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor="#818cf8" />
          <stop offset="70%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>

        {/* Mask to cut out the DEV letters from the central circle */}
        <mask id="devgram-logo-mask">
          {/* Base circle: everything white here is visible */}
          <circle cx="50" cy="50" r="26" fill="#ffffff" />
          
          {/* Letters DEV: drawn in black to cut them out of the circle */}
          {/* D */}
          <path 
            d="M 28 39 H 38 L 42 43 V 57 L 38 61 H 28 V 39 Z M 32 44 V 56 H 36 L 38 54 V 46 L 36 44 H 32 Z" 
            fill="#000000" 
          />
          {/* E */}
          <path 
            d="M 45 39 H 55 V 43 H 49 V 48 H 54 V 52 H 49 V 57 H 55 V 61 H 45 V 39 Z" 
            fill="#000000" 
          />
          {/* V */}
          <path 
            d="M 58 39 H 63 L 66 51 L 69 39 H 74 L 69 61 H 63 L 58 39 Z" 
            fill="#000000" 
          />
        </mask>
      </defs>

      {/* 1. Outer Sweep Thin Lines */}
      <path 
        d="M 20 26 A 38 38 0 0 1 76 18" 
        stroke="url(#devgram-logo-grad)" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
      />
      <path 
        d="M 80 74 A 38 38 0 0 1 24 82" 
        stroke="url(#devgram-logo-grad)" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
      />

      {/* 2. Outer Crescent Thick Lines */}
      <path 
        d="M 16 42 A 36 36 0 0 1 60 14" 
        stroke="url(#devgram-logo-grad)" 
        strokeWidth="4" 
        strokeLinecap="round" 
      />
      <path 
        d="M 84 58 A 36 36 0 0 1 40 86" 
        stroke="url(#devgram-logo-grad)" 
        strokeWidth="4" 
        strokeLinecap="round" 
      />

      {/* 3. Central Circle with Cutout DEV text */}
      <circle 
        cx="50" 
        cy="50" 
        r="26" 
        fill="url(#devgram-logo-grad)" 
        mask="url(#devgram-logo-mask)" 
      />
    </svg>
  )
}

export default DevGramLogo
