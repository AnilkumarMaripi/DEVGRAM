import React from 'react'

const shimmerStyle = {
  background: 'linear-gradient(90deg, #18181b 0%, #27272a 50%, #18181b 100%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite linear',
  borderRadius: '6px',
}

export function StoriesSkeleton() {
  return (
    <div style={{ display: 'flex', gap: '16px', padding: '16px 20px', overflowX: 'hidden' }}>
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{ ...shimmerStyle, width: '64px', height: '64px', borderRadius: '50%' }} />
          <div style={{ ...shimmerStyle, width: '48px', height: '10px' }} />
        </div>
      ))}
    </div>
  )
}

export function FeedSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '640px', margin: '0 auto' }}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            background: '#121217',
            border: '1px solid #1f1f23',
            borderRadius: '16px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ ...shimmerStyle, width: '44px', height: '44px', borderRadius: '50%' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ ...shimmerStyle, width: '120px', height: '14px' }} />
              <div style={{ ...shimmerStyle, width: '80px', height: '10px' }} />
            </div>
          </div>

          {/* Body Lines */}
          <div style={{ ...shimmerStyle, width: '90%', height: '14px' }} />
          <div style={{ ...shimmerStyle, width: '70%', height: '14px' }} />

          {/* Media box */}
          <div style={{ ...shimmerStyle, width: '100%', height: '280px', borderRadius: '12px' }} />

          {/* Footer actions */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ ...shimmerStyle, width: '28px', height: '24px' }} />
            <div style={{ ...shimmerStyle, width: '28px', height: '24px' }} />
            <div style={{ ...shimmerStyle, width: '28px', height: '24px' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        <div style={{ ...shimmerStyle, width: '96px', height: '96px', borderRadius: '50%' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
          <div style={{ ...shimmerStyle, width: '160px', height: '20px' }} />
          <div style={{ ...shimmerStyle, width: '100px', height: '12px' }} />
          <div style={{ ...shimmerStyle, width: '220px', height: '14px' }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} style={{ ...shimmerStyle, aspectRatio: '1', borderRadius: '10px' }} />
        ))}
      </div>
    </div>
  )
}

export function MessagesSkeleton() {
  return (
    <div style={{ display: 'flex', height: '100%', gap: '16px', padding: '16px' }}>
      <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '8px' }}>
            <div style={{ ...shimmerStyle, width: '40px', height: '40px', borderRadius: '50%' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
              <div style={{ ...shimmerStyle, width: '100px', height: '12px' }} />
              <div style={{ ...shimmerStyle, width: '140px', height: '10px' }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'flex-end', padding: '16px' }}>
        <div style={{ ...shimmerStyle, width: '180px', height: '36px', borderRadius: '12px', alignSelf: 'flex-start' }} />
        <div style={{ ...shimmerStyle, width: '240px', height: '44px', borderRadius: '12px', alignSelf: 'flex-end' }} />
        <div style={{ ...shimmerStyle, width: '140px', height: '32px', borderRadius: '12px', alignSelf: 'flex-start' }} />
      </div>
    </div>
  )
}

export function SearchSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px' }}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 8px' }}>
          <div style={{ ...shimmerStyle, width: '36px', height: '36px', borderRadius: '50%' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            <div style={{ ...shimmerStyle, width: '100px', height: '12px' }} />
            <div style={{ ...shimmerStyle, width: '70px', height: '10px' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

