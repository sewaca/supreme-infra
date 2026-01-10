type Props = {
  size: number;
};

export const Spacer = ({ size }: Props) => {
  return <div style={{ height: `${size * 2}px` }}>&nbsp;</div>;
};
