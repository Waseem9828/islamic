import { ImageResponse } from 'next/og'

export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

// Custom Mosque SVG component as lucide-react does not have one.
function MosqueIcon({ size = 20, color = 'white' }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M2 22h20"/>
            <path d="M4 15V8c0-5.52 4.48-10 10-10s10 4.48 10 10v7"/>
            <path d="M12 22V10"/>
            <path d="M14 4c-1.1.6-2 1.4-2.5 2.5"/>
            <path d="M10 4c1.1.6 2 1.4 2.5 2.5"/>
            <path d="M4 22V10"/>
            <path d="M20 22V10"/>
        </svg>
    );
}

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: '#006400',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: 8
        }}
      >
        <MosqueIcon size={20} />
      </div>
    ),
    {
      ...size,
    }
  )
}
