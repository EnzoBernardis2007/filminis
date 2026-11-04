const SvgFilm = ({ size = 24, ...props }) => {
  const filmStyle = {
    width: `${size}px`,
    height: 'auto',
    display: 'block',
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      style={filmStyle}
      {...props}
    >
      <path
        stroke="#fff"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4.18 2h15.64A2.18 2.18 0 0 1 22 4.18v15.64A2.18 2.18 0 0 1 19.82 22H4.18A2.18 2.18 0 0 1 2 19.82V4.18A2.18 2.18 0 0 1 4.18 2M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5"
      />
    </svg>
  );
};

export default SvgFilm;