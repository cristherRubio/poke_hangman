export default function Hearts({ total, remaining }) {
  return (
    <h2>
      {Array.from({ length: total }, (_, i) => (
        <img
          key={i}
          src={i < remaining ? '/images/pixel_heart.svg' : '/images/pixel_heart_empty.svg'}
          width="75px"
          className={i < remaining ? 'heart-active' : ''}
          style={{ imageRendering: 'pixelated' }}
          alt=""
        />
      ))}
    </h2>
  );
}