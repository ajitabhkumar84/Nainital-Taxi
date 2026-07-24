'use client';

export default function SocialProofTicker() {
  // Realistic booking entries
  const bookings = [
    'Rajesh from Delhi booked Nainital Darshan - 5 min ago',
    'Priya from Mumbai booked Kathgodam Transfer - 12 min ago',
    'Amit from Bangalore booked Jim Corbett Tour - 23 min ago',
    'Sneha from Pune booked Bhimtal Lake Tour - 31 min ago',
    'Vikram from Gurgaon booked Ranikhet Day Trip - 45 min ago',
    'Anjali from Hyderabad booked Pantnagar Airport Pickup - 52 min ago',
    'Karan from Chennai booked Kainchi Dham Visit - 1 hour ago',
    'Meera from Kolkata booked Mukteshwar Adventure - 1 hour ago',
    'Rohit from Noida booked Nainital Darshan - 2 hours ago',
    'Divya from Jaipur booked 3 Day Nainital Package - 2 hours ago',
    'Sanjay from Lucknow booked Corbett Safari - 3 hours ago',
    'Pooja from Ahmedabad booked Bhimtal Tour - 3 hours ago',
  ];

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-sunshine via-sunshine/90 to-sunshine border-y-3 border-ink py-3 md:py-4">
      <div className="ticker-wrapper">
        <div className="ticker-content">
          {/* First set */}
          {bookings.map((booking, idx) => (
            <span key={`first-${idx}`} className="ticker-item font-body font-semibold text-ink text-sm md:text-base">
              🎉 {booking}
            </span>
          ))}
          {/* Duplicate set for seamless loop */}
          {bookings.map((booking, idx) => (
            <span key={`second-${idx}`} className="ticker-item font-body font-semibold text-ink text-sm md:text-base">
              🎉 {booking}
            </span>
          ))}
        </div>
      </div>

      <style jsx>{`
        .ticker-wrapper {
          overflow: hidden;
          width: 100%;
        }

        .ticker-content {
          display: flex;
          animation: scroll 60s linear infinite;
          will-change: transform;
        }

        .ticker-item {
          flex-shrink: 0;
          padding: 0 2rem;
          white-space: nowrap;
        }

        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        /* Pause animation on hover */
        .ticker-content:hover {
          animation-play-state: paused;
        }

        /* Mobile: Single visible item */
        @media (max-width: 768px) {
          .ticker-item {
            padding: 0 1rem;
          }
        }
      `}</style>
    </div>
  );
}
