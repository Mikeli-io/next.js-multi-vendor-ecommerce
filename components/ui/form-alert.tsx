/** Form-level message shown above the fields, in the design's error or success tone. */
export function FormAlert({
  message,
  tone = "error",
}: {
  message?: string;
  tone?: "error" | "success";
}) {
  if (!message) return null;
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`mb-5 rounded-[12px] border px-4 py-3 text-[13px] leading-[1.5] font-medium ${
        tone === "error"
          ? "border-error/20 bg-error-bg text-error"
          : "border-success/20 bg-success-bg text-success"
      }`}
    >
      {message}
    </p>
  );
}
