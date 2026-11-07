import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "solid" | "outline" | "lime";

const variantClass: Record<Variant, string> = {
  solid:
    "bg-kc-ink text-white hover:bg-kc-ink/90 border-2 border-kc-ink",
  outline:
    "bg-transparent text-kc-ink border-2 border-kc-ink hover:bg-kc-muted",
  lime: "bg-kc-lime text-kc-ink border-2 border-kc-ink hover:brightness-95",
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
  const classes = `inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-medium transition ${variantClass[variant]} ${className}`;

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
