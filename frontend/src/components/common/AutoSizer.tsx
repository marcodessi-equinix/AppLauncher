import { ReactElement, useLayoutEffect, useRef, useState } from 'react';

type AutoSizerProps = {
  children: (props: { height: number; width: number }) => ReactElement | null;
  className?: string;
  style?: React.CSSProperties;
};

export const AutoSizer = ({ children, className, style }: AutoSizerProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!ref.current) return;
    
    // We observe the parent element because AutoSizer is usually put inside a container
    // that defines the size. If we observe ref.current, it might be 0x0 if we don't style it.
    // However, the standard pattern is AutoSizer fills the parent.
    // Let's observe the parent to be safe, OR ensure this div fills parent.
    // We already added style={{ width: 100%, height: 100% }} in usage.
    // So observing ref.current is correct IF it has size.
    
    const element = ref.current;
    
    // Initial size
    setSize({ width: element.offsetWidth, height: element.offsetHeight });

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === element) {
           // Use contentRect or offsetWidth/Height
           // entry.contentRect is mostly what we want, but offsetWidth includes border if border-box?
           // react-virtualized-auto-sizer uses offsetWidth/Height usually.
           
           // Wait, contentRect does NOT include padding/border.
           // If Grid needs full available space including padding of this container?
           // Usually AutoSizer expands to fill parent.
           // Let's use element.offsetWidth/offsetHeight to be consistent with DOM layout.
           setSize({
             width: element.offsetWidth,
             height: element.offsetHeight
           });
        }
      }
    });

    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div 
      ref={ref} 
      className={className} 
      style={{ width: '100%', height: '100%', overflow: 'hidden', ...style }}
    >
      {size.width > 0 && size.height > 0 && children(size)}
    </div>
  );
};
