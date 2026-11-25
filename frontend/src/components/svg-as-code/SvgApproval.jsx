const SvgApproval = ({ size = 24, ...props }) => {
  const approvalStyle = {
    width: `${size}px`,
    height: 'auto',
    display: 'block',
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      style={approvalStyle}
      {...props}
    >
      <path
        stroke="#fff"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4"
      />
      <circle
        stroke="#fff"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        cx="12"
        cy="12"
        r="10"
      />
    </svg>
  );
};

export default SvgApproval;