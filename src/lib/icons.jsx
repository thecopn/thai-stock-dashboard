export const iconPaths = {
  arrowLeft: "M19 12H5m7-7-7 7 7 7",
  barChart: "M4 19V9m8 10V5m8 14v-7",
  building: "M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M4 21h16M8 7h4M8 11h4M8 15h4M16 9h2a2 2 0 0 1 2 2v10",
  calendar: "M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
  chevronRight: "M9 18l6-6-6-6",
  dollar: "M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6",
  download: "M12 3v12m0 0 5-5m-5 5-5-5M5 21h14",
  fileText: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8ZM14 2v6h6M8 13h8M8 17h8M8 9h2",
  externalLink: "M14 3h7v7M10 14L21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5",
  filter: "M3 5h18M6 12h12M10 19h4",
  lineChart: "M3 3v18h18M7 15l4-4 3 3 5-7",
  newspaper: "M4 4h14a2 2 0 0 1 2 2v13a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V5a1 1 0 0 1 1-1Zm4 4h6M8 12h8M8 16h5",
  search: "M21 21l-4.35-4.35M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z",
  settings: "M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5ZM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.4 1.08V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 8.6 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 0-1.08-.4H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 8.6a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-.6 1.65 1.65 0 0 0 .4-1.08V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15.4 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.24.37.6.65 1 .8.2.08.42.12.6.12H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1.08Z",
  shieldAlert: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10ZM12 8v5M12 17h.01",
  sparkles: "M12 3l1.7 4.6L18 9l-4.3 1.4L12 15l-1.7-4.6L6 9l4.3-1.4L12 3ZM19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14ZM5 14l.9 2.1L8 17l-2.1.9L5 20l-.9-2.1L2 17l2.1-.9L5 14Z",
  trendingDown: "M22 17l-8.5-8.5-5 5L2 7m20 10h-6m6 0v-6",
  trendingUp: "M22 7l-8.5 8.5-5-5L2 17m20-10h-6m6 0v6",
};

export function Icon({ name, size = 18, className = "" }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={iconPaths[name] || iconPaths.barChart} />
    </svg>
  );
}
