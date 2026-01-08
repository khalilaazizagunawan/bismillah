function Button({ children, variant = "primary", className = "", ...props }) {
  const base = "px-6 py-3 rounded-lg font-medium transition";
  const variants = {
    primary: "bg-primary text-white hover:bg-secondary",
    outline: "border-2 border-primary text-primary hover:bg-primary hover:text-white",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export default Button;