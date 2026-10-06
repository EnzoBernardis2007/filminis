const SvgLogo = ({ size = 52, ...props }) => {
  const logoStyle = {
    width: `${size}px`,
    height: 'auto',
    display: 'block', 
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 52 47" 
      fill="none"
      style={logoStyle} 
      {...props}
    >
      <path
        stroke="#fff"
        strokeWidth={3}
        d="m2.55 1.5 38.888 42m-29.555-42H2.549l23.334 42 23.333-42h-9.333m9.333 0-38.889 42m1.556-42s3.362 11.667 14 11.667 14-11.667 14-11.667m-28 0h28m-14 4.667c-4.433 0-5.834-4.667-5.834-4.667h11.667s-1.401 4.667-5.833 4.667Z"
      />
    </svg>
  );
};

export default SvgLogo;