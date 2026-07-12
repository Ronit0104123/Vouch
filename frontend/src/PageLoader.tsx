function PageLoader() {
  return (
    <main style={{ minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          border: "3px solid var(--border)",
          borderTopColor: "var(--accent)",
          animation: "vouch-spin 0.7s linear infinite",
        }}
      />
    </main>
  );
}

export default PageLoader;
