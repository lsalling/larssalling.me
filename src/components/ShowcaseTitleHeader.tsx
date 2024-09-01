import { useEffect, useState } from "react";
import clsx from "clsx";

type Props = {
  id: string;
  title: string;
  offset: number;
};

export function ShowcaseTitleHeader({ title, offset, id }: Props) {
  const [viewed, setViewed] = useState(false);

  useEffect(() => {
    setViewed(true);
  }, []);

  return (
    <div
      id={id}
      className="absolute -top-[240px] hidden md:block"
      style={{
        translate: "-55px 0",
        left: `-${offset}px`,
        clipPath: `inset(0 0 0 ${offset}px)`,
      }}
    >
      <div className="absolute inset-x-0 bottom-0 z-[2] h-[200px] bg-gradient-to-t from-gray-50 via-gray-50"></div>
      <span
        data-project-title={title}
        aria-hidden="true"
        className={clsx(
          "accent z-0 block size-fit w-[3000px] whitespace-nowrap text-[540px] font-bold leading-none tracking-tighter text-white before:absolute before:inset-0 before:-z-10 before:text-transparent before:content-[attr(data-project-title)]",
          viewed
            ? "translate-x-0 opacity-100 before:drop-shadow-xl"
            : "-translate-x-12 opacity-0 drop-shadow-none",
        )}
        style={{
          transition: "all 2.5s cubic-bezier(0.165, 0.84, 0.44, 1) 0.5s",
        }}
      >
        {title}
      </span>
    </div>
  );
}
