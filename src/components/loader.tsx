import dynamic from "next/dynamic";
import type { FC } from "react";

interface LoaderProps {
  className?: string;
  size?: number;
  speed?: number;
  lineWeight?: number;
  color?: string;
}

// Dynamically import RingLoader with SSR disabled
const RingLoader = dynamic(() => import("ldrs").then((mod) => mod.RingLoader), {
  ssr: false,
  loading: () => <div className="animate-spin rounded-full border-2 border-white border-t-transparent" style={{ width: 16, height: 16 }} />
});

const Loader: FC<LoaderProps> = ({
  className,
  size = 16,
  speed = 2,
  lineWeight = 7,
  color = "white",
}) => {
  return (
    <div className={className}>
      <RingLoader size={size} speed={speed} color={color} stroke={lineWeight} />
    </div>
  );
};

export default Loader;
