export const VerifiedIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width={25}
    height={25}
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="m8.636 25-2.159-3.81-4.09-.952.397-4.405L0 12.5l2.784-3.333-.398-4.405 4.091-.952L8.637 0 12.5 1.726 16.364 0l2.159 3.81 4.09.952-.397 4.405L25 12.5l-2.784 3.333.398 4.405-4.091.953L16.363 25 12.5 23.274zm2.67-8.274L17.728 10l-1.59-1.726-4.83 5.06-2.443-2.5L7.273 12.5z"
      className="fill-accent-verified"
    />
  </svg>
);

export const GreenCheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width={56}
    height={55}
    viewBox="0 0 56 55"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect
      x={0.875}
      width={55}
      height={55}
      rx={27.5}
      className="fill-accent-success"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M41.073 17.719c.57.57.57 1.492 0 2.062L25.03 35.823c-.57.57-1.493.57-2.062 0l-7.292-7.292a1.458 1.458 0 0 1 2.063-2.062l6.26 6.26 15.01-15.01c.57-.57 1.493-.57 2.063 0"
      className="fill-brand-500"
    />
  </svg>
);
