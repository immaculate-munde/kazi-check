import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "solid" | "outline" | "lime";

const variantClass: Record<Variant, string> = {
  solid: "bg-kc-navy text-white hover:opacity-90",
  outline:
    "bg-transparent text-foreground ring-1 ring-foreground/15 hover:bg-foreground/8",
  lime: "bg-kc-teal text-white hover:opacity-90",
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
  const classes = `inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold tracking-tight transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kc-teal disabled:cursor-not-allowed disabled:opacity-50 ${variantClass[variant]} ${className}`;

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
