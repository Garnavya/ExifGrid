import React from 'react';

export default function ImageFilters() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none', zIndex: -1 }}>
      
      {/* 1. SENSOR DUST AID */}
      <filter id="dust-spot-visualizer" colorInterpolationFilters="sRGB">
        <feColorMatrix type="matrix" values="
          0.33 0.33 0.33 0 0
          0.33 0.33 0.33 0 0
          0.33 0.33 0.33 0 0
          0 0 0 1 0" />
        <feConvolveMatrix order="3" preserveAlpha="true" kernelMatrix="
          -1 -1 -1
          -1  8 -1
          -1 -1 -1" />
        <feComponentTransfer>
          <feFuncR type="linear" slope="4" intercept="0"/>
          <feFuncG type="linear" slope="4" intercept="0"/>
          <feFuncB type="linear" slope="4" intercept="0"/>
        </feComponentTransfer>
      </filter>

      {/* 2. CYBERPUNK DUOTONE */}
      <filter id="filter-cyberpunk" colorInterpolationFilters="sRGB">
        <feColorMatrix type="matrix" values="
          0.33 0.33 0.33 0 0
          0.33 0.33 0.33 0 0
          0.33 0.33 0.33 0 0
          0 0 0 1 0" result="gray" />
        <feComponentTransfer>
          {/* Shadows to Deep Purple, Highlights to Neon Pink */}
          <feFuncR type="table" tableValues="0.2 1" />
          <feFuncG type="table" tableValues="0 0.2" />
          <feFuncB type="table" tableValues="0.4 0.8" />
        </feComponentTransfer>
      </filter>

      {/* 3. POSTERIZE (COMIC BOOK) */}
      <filter id="filter-posterize" colorInterpolationFilters="sRGB">
        {/* Reduces colors to 5 harsh bands */}
        <feComponentTransfer>
          <feFuncR type="discrete" tableValues="0 0.25 0.5 0.75 1" />
          <feFuncG type="discrete" tableValues="0 0.25 0.5 0.75 1" />
          <feFuncB type="discrete" tableValues="0 0.25 0.5 0.75 1" />
        </feComponentTransfer>
      </filter>

      {/* 4. CHROMATIC ABERRATION (GLITCH) */}
      <filter id="filter-glitch" colorInterpolationFilters="sRGB">
        {/* Isolate and shift Red */}
        <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" />
        <feOffset in="red" dx="6" dy="0" result="red_shifted" />

        {/* Isolate Green */}
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green" />

        {/* Isolate and shift Blue */}
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue" />
        <feOffset in="blue" dx="-6" dy="0" result="blue_shifted" />

        {/* Recombine channels */}
        <feComposite in="red_shifted" in2="green" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="rg" />
        <feComposite in="rg" in2="blue_shifted" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
      </filter>

      {/* 5. THERMAL VISION */}
      <filter id="filter-thermal" colorInterpolationFilters="sRGB">
        <feColorMatrix type="matrix" values="
          0.33 0.33 0.33 0 0
          0.33 0.33 0.33 0 0
          0.33 0.33 0.33 0 0
          0 0 0 1 0" />
        <feComponentTransfer>
          <feFuncR type="table" tableValues="0.2 0.8 1 1" />
          <feFuncG type="table" tableValues="0 0 0.8 1" />
          <feFuncB type="table" tableValues="0.5 0 0 0.5" />
        </feComponentTransfer>
      </filter>

    </svg>
  );
}