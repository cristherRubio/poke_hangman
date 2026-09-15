export default function Hearts({ count }) {
  return (
    <h2>
      {Array.from({ length: count }, (_, i) => (
        <img
          key={i}
          src="/images/pixel_heart.svg"
          width="75px"
          style={{ imageRendering: 'pixelated' }}
          alt=""
        />
      ))}
    </h2>
  );
}