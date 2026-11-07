import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "solid" | "outline" | "lime";

const variantClass: Record<Variant, string> = {
  solid:
    "bg-kc-ink text-kc-on-ink hover:opacity-90 border-2 border-kc-ink",
  outline:
    "bg-transparent text-kc-ink border-2 border-kc-ink hover:bg-kc-muted",
  lime: "bg-kc-lime text-[#191a23] border-2 border-kc-ink hover:brightness-95",
};

type CommonProps = {
  children: ReactNode;
  variant?: Variant;
  className?: string;
};

type ButtonAsButton = CommonProps &
  Omit<ComponentProps<"button">, "className" | "children"> & {
    href?: undefined;
  };

type ButtonAsLink = CommonProps & {
  href: string;
};

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { children, variant = "solid", className = "" } = props;
  const classes = `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-medium transition active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kc-ink disabled:cursor-not-allowed disabled:opacity-50 ${variantClass[variant]} ${className}`;

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  const buttonProps = props as ButtonAsButton;
  const {
    variant: _variant,
    className: _className,
    children: _children,
    ...rest
  } = buttonProps;
  return (
    <button type={rest.type ?? "button"} className={classes} {...rest}>
      {children}
    </button>
  );
}
