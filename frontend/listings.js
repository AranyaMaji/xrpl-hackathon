// All coordinates are verified residential streets surrounding UNSW Kensington Campus, NSW
// startISO evaluated at page-load so statuses are always relative to "now"

const NOW = Date.now();
const min = (n) => n * 60_000;
const hr  = (n) => n * 3_600_000;

export const LISTINGS = [
  // ==========================================
  // 🟢 AVAILABLE NOW (12 Spots)
  // ==========================================
  
  // North Campus (High St / Randwick)
  {
    id: "unsw-001", title: "High St Secure Bay", subtitle: "Opposite Gate 9 · 1 min walk",
    address: "14 High St, Kensington NSW",
    lat: -33.9155, lng: 151.2280,
    ratePerHourXrp: 3.0, depositMultiple: 3, overstayMultiple: 2, access: "Driveway bay",
    ownerWallet: "rPT1SzmFn5GNiEWMvKgXW2aKuJGCFe5Va", rating: 4.8, totalBookings: 112,
    features: ["CCTV monitored", "Flat surface", "Easy exit"], maxVehicleHeight: null,
    availability: { startISO: new Date(NOW).toISOString(), endISO: new Date(NOW + hr(8)).toISOString() },
    rules: ["Stay strictly within yellow lines.", "Leave by end time."]
  },
  {
    id: "unsw-002", title: "Upper Campus Driveway", subtitle: "Near Library · 3 min walk",
    address: "55 High St, Randwick NSW",
    lat: -33.9161, lng: 151.2340,
    ratePerHourXrp: 3.5, depositMultiple: 3, overstayMultiple: 2, access: "Open driveway",
    ownerWallet: "rKowuBq4dwGGQMDU1MLPF9cBfM8yxkrXL", rating: 4.9, totalBookings: 84,
    features: ["Very wide", "Quick walk to upper campus"], maxVehicleHeight: null,
    availability: { startISO: new Date(NOW).toISOString(), endISO: new Date(NOW + hr(5)).toISOString() },
    rules: ["Do not block the pedestrian footpath."]
  },
  {
    id: "unsw-003", title: "Clara St Quiet Bay", subtitle: "Randwick side · 6 min walk",
    address: "12 Clara St, Randwick NSW",
    lat: -33.9115, lng: 151.2335,
    ratePerHourXrp: 1.5, depositMultiple: 2, overstayMultiple: 2, access: "Kerbside bay",
    ownerWallet: "rGWrZyax5eXbi5gs49MRZKmm8ksc2QFAM", rating: 4.2, totalBookings: 19,
    features: ["Cheap", "Quiet street", "Shaded in afternoon"], maxVehicleHeight: null,
    availability: { startISO: new Date(NOW).toISOString(), endISO: new Date(NOW + hr(12)).toISOString() },
    rules: ["Park close to the curb."]
  },

  // East Campus (Botany St)
  {
    id: "unsw-004", title: "Botany St Covered", subtitle: "Near Gate 11 · 2 min walk",
    address: "12 Botany St, Randwick NSW",
    lat: -33.9180, lng: 151.2375,
    ratePerHourXrp: 2.0, depositMultiple: 3, overstayMultiple: 3, access: "Covered driveway",
    ownerWallet: "rN7n3473SaZBCG4dFL80J7zBKaM3BPQFL", rating: 4.7, totalBookings: 56,
    features: ["Undercover", "Rain protection"], maxVehicleHeight: 2.1,
    availability: { startISO: new Date(NOW).toISOString(), endISO: new Date(NOW + hr(6)).toISOString() },
    rules: ["Height limit 2.1m. No large vans."]
  },
  {
    id: "unsw-005", title: "Wansey Rd Courtyard", subtitle: "Light rail adjacent · 4 min walk",
    address: "8 Wansey Rd, Randwick NSW",
    lat: -33.9145, lng: 151.2390,
    ratePerHourXrp: 2.8, depositMultiple: 3, overstayMultiple: 2, access: "Private courtyard",
    ownerWallet: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh", rating: 5.0, totalBookings: 201,
    features: ["Gated", "Extremely secure"], maxVehicleHeight: null,
    availability: { startISO: new Date(NOW).toISOString(), endISO: new Date(NOW + hr(4)).toISOString() },
    rules: ["Gate auto-opens on booking confirmation."]
  },

  // South Campus (Barker St)
  {
    id: "unsw-006", title: "Barker St Premium", subtitle: "Opposite Gate 14 · 1 min walk",
    address: "110 Barker St, Kingsford NSW",
    lat: -33.9215, lng: 151.2350,
    ratePerHourXrp: 3.5, depositMultiple: 3, overstayMultiple: 2, access: "Driveway bay",
    ownerWallet: "rEfrEpYtS3SXqR2eFEZc3fLsrMoJU5Kqx", rating: 4.6, totalBookings: 43,
    features: ["Premium location", "Well lit"], maxVehicleHeight: null,
    availability: { startISO: new Date(NOW).toISOString(), endISO: new Date(NOW + hr(9)).toISOString() },
    rules: ["Do not block the garbage bins."]
  },
  {
    id: "unsw-007", title: "Lower Campus Access", subtitle: "Near Gate 2 · 2 min walk",
    address: "12 Barker St, Kingsford NSW",
    lat: -33.9200, lng: 151.2260,
    ratePerHourXrp: 4.0, depositMultiple: 3, overstayMultiple: 3, access: "Driveway bay",
    ownerWallet: "rLDYrujdKUfVx28MyFaad6tK9rB9KnEZkq", rating: 4.9, totalBookings: 320,
    features: ["Highest demand", "Instant campus access"], maxVehicleHeight: null,
    availability: { startISO: new Date(NOW).toISOString(), endISO: new Date(NOW + hr(3)).toISOString() },
    rules: ["Strict 3x penalty for overstaying."]
  },
  {
    id: "unsw-008", title: "Strachan St Value", subtitle: "Kingsford side · 7 min walk",
    address: "18 Strachan St, Kingsford NSW",
    lat: -33.9230, lng: 151.2270,
    ratePerHourXrp: 1.8, depositMultiple: 2, overstayMultiple: 2, access: "Kerbside bay",
    ownerWallet: "rMWuhsGpyTgJzLhKhPt2VvnYFAFcLAMEkP", rating: 4.1, totalBookings: 12,
    features: ["Cheap", "Easy parking"], maxVehicleHeight: null,
    availability: { startISO: new Date(NOW).toISOString(), endISO: new Date(NOW + hr(10)).toISOString() },
    rules: ["Standard residential rules apply."]
  },
  {
    id: "unsw-009", title: "Forsyth St Shaded", subtitle: "Quiet area · 6 min walk",
    address: "40 Forsyth St, Kingsford NSW",
    lat: -33.9225, lng: 151.2310,
    ratePerHourXrp: 2.0, depositMultiple: 3, overstayMultiple: 2, access: "Shaded driveway",
    ownerWallet: "rPT1SzmFn5GNiEWMvKgXW2aKuJGCFe5Va", rating: 4.4, totalBookings: 38,
    features: ["Tree shade", "Quiet"], maxVehicleHeight: null,
    availability: { startISO: new Date(NOW).toISOString(), endISO: new Date(NOW + hr(6)).toISOString() },
    rules: ["Beware of falling leaves."]
  },

  // West Campus (Anzac Pde / Kensington)
  {
    id: "unsw-010", title: "Anzac Pde Express", subtitle: "Main road access · 3 min walk",
    address: "150 Anzac Pde, Kensington NSW",
    lat: -33.9185, lng: 151.2245,
    ratePerHourXrp: 4.5, depositMultiple: 3, overstayMultiple: 2, access: "Driveway bay",
    ownerWallet: "rKowuBq4dwGGQMDU1MLPF9cBfM8yxkrXL", rating: 4.8, totalBookings: 215,
    features: ["Main road", "CCTV"], maxVehicleHeight: null,
    availability: { startISO: new Date(NOW).toISOString(), endISO: new Date(NOW + hr(4)).toISOString() },
    rules: ["Pull in forwards only. Traffic is heavy."]
  },
  {
    id: "unsw-011", title: "Doncaster Ave Long Stay", subtitle: "Kensington side · 5 min walk",
    address: "30 Doncaster Ave, Kensington NSW",
    lat: -33.9140, lng: 151.2215,
    ratePerHourXrp: 2.0, depositMultiple: 2, overstayMultiple: 2, access: "Open driveway",
    ownerWallet: "rGWrZyax5eXbi5gs49MRZKmm8ksc2QFAM", rating: 4.3, totalBookings: 67,
    features: ["Good for full day", "Wide street"], maxVehicleHeight: null,
    availability: { startISO: new Date(NOW).toISOString(), endISO: new Date(NOW + hr(12)).toISOString() },
    rules: ["Do not block the mailbox."]
  },
  {
    id: "unsw-012", title: "Day Ave Private", subtitle: "Near NIDA · 4 min walk",
    address: "15 Day Ave, Kensington NSW",
    lat: -33.9185, lng: 151.2220,
    ratePerHourXrp: 2.5, depositMultiple: 3, overstayMultiple: 2, access: "Driveway bay",
    ownerWallet: "rN7n3473SaZBCG4dFL80J7zBKaM3BPQFL", rating: 4.5, totalBookings: 91,
    features: ["Very quiet", "Safe neighborhood"], maxVehicleHeight: null,
    availability: { startISO: new Date(NOW).toISOString(), endISO: new Date(NOW + hr(8)).toISOString() },
    rules: ["Reverse parking recommended."]
  },

  // ==========================================
  // 🟡 AVAILABLE SOON (Within 2 Hours) (6 Spots)
  // ==========================================
  
  {
    id: "unsw-013", title: "High St Hospital Side", subtitle: "Near Prince of Wales · 4 min walk",
    address: "90 High St, Randwick NSW",
    lat: -33.9168, lng: 151.2370,
    ratePerHourXrp: 2.5, depositMultiple: 3, overstayMultiple: 2, access: "Kerbside bay",
    ownerWallet: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh", rating: 4.1, totalBookings: 44,
    features: ["Hospital adjacent", "Street lit"], maxVehicleHeight: null,
    availability: { startISO: new Date(NOW + min(30)).toISOString(), endISO: new Date(NOW + hr(6)).toISOString() },
    rules: ["Available in 30 mins."]
  },
  {
    id: "unsw-014", title: "Botany St Budget", subtitle: "East side · 5 min walk",
    address: "48 Botany St, Randwick NSW",
    lat: -33.9205, lng: 151.2370,
    ratePerHourXrp: 1.5, depositMultiple: 2, overstayMultiple: 2, access: "Open driveway",
    ownerWallet: "rEfrEpYtS3SXqR2eFEZc3fLsrMoJU5Kqx", rating: 4.0, totalBookings: 22,
    features: ["Budget", "No height limit"], maxVehicleHeight: null,
    availability: { startISO: new Date(NOW + hr(1)).toISOString(), endISO: new Date(NOW + hr(8)).toISOString() },
    rules: ["Available in 1 hour."]
  },
  {
    id: "unsw-015", title: "Barker St Mid", subtitle: "South Campus · 3 min walk",
    address: "45 Barker St, Kingsford NSW",
    lat: -33.9205, lng: 151.2300,
    ratePerHourXrp: 3.0, depositMultiple: 3, overstayMultiple: 2, access: "Driveway bay",
    ownerWallet: "rLDYrujdKUfVx28MyFaad6tK9rB9KnEZkq", rating: 4.6, totalBookings: 110,
    features: ["Central location"], maxVehicleHeight: null,
    availability: { startISO: new Date(NOW + min(45)).toISOString(), endISO: new Date(NOW + hr(5)).toISOString() },
    rules: ["Available in 45 mins."]
  },
  {
    id: "unsw-016", title: "Willis St Shaded", subtitle: "Near oval · 5 min walk",
    address: "22 Willis St, Kingsford NSW",
    lat: -33.9215, lng: 151.2290,
    ratePerHourXrp: 2.5, depositMultiple: 3, overstayMultiple: 2, access: "Shaded driveway",
    ownerWallet: "rMWuhsGpyTgJzLhKhPt2VvnYFAFcLAMEkP", rating: 4.5, totalBookings: 35,
    features: ["Tree shade"], maxVehicleHeight: null,
    availability: { startISO: new Date(NOW + hr(1.5)).toISOString(), endISO: new Date(NOW + hr(7)).toISOString() },
    rules: ["Available in 1.5 hours."]
  },
  {
    id: "unsw-017", title: "Anzac Pde Light Rail", subtitle: "UNSW stop adjacent · 2 min walk",
    address: "88 Anzac Pde, Kensington NSW",
    lat: -33.9160, lng: 151.2230,
    ratePerHourXrp: 4.0, depositMultiple: 3, overstayMultiple: 3, access: "Private courtyard",
    ownerWallet: "rPT1SzmFn5GNiEWMvKgXW2aKuJGCFe5Va", rating: 4.9, totalBookings: 290,
    features: ["Next to tram", "Gated"], maxVehicleHeight: 2.4,
    availability: { startISO: new Date(NOW + min(20)).toISOString(), endISO: new Date(NOW + hr(4)).toISOString() },
    rules: ["Available in 20 mins. Gate code on booking."]
  },
  {
    id: "unsw-018", title: "Ascot St Secure", subtitle: "West Campus · 4 min walk",
    address: "10 Ascot St, Kensington NSW",
    lat: -33.9145, lng: 151.2245,
    ratePerHourXrp: 3.0, depositMultiple: 3, overstayMultiple: 2, access: "Driveway bay",
    ownerWallet: "rKowuBq4dwGGQMDU1MLPF9cBfM8yxkrXL", rating: 4.7, totalBookings: 75,
    features: ["CCTV", "Floodlit"], maxVehicleHeight: null,
    availability: { startISO: new Date(NOW + hr(1)).toISOString(), endISO: new Date(NOW + hr(9)).toISOString() },
    rules: ["Available in 1 hour."]
  },

  // ==========================================
  // ⚪ AVAILABLE LATER (6 Spots)
  // ==========================================

  {
    id: "unsw-019", title: "Arthur St Hideaway", subtitle: "North edge · 8 min walk",
    address: "33 Arthur St, Randwick NSW",
    lat: -33.9130, lng: 151.2360,
    ratePerHourXrp: 2.0, depositMultiple: 2, overstayMultiple: 2, access: "Kerbside bay",
    ownerWallet: "rGWrZyax5eXbi5gs49MRZKmm8ksc2QFAM", rating: 4.0, totalBookings: 15,
    features: ["Tucked away"], maxVehicleHeight: null,
    availability: { startISO: new Date(NOW + hr(3)).toISOString(), endISO: new Date(NOW + hr(10)).toISOString() },
    rules: ["Available in 3 hours."]
  },
  {
    id: "unsw-020", title: "Magill St Drive", subtitle: "Randwick residential · 7 min walk",
    address: "14 Magill St, Randwick NSW",
    lat: -33.9180, lng: 151.2395,
    ratePerHourXrp: 1.5, depositMultiple: 2, overstayMultiple: 2, access: "Open driveway",
    ownerWallet: "rN7n3473SaZBCG4dFL80J7zBKaM3BPQFL", rating: 4.2, totalBookings: 28,
    features: ["Long term OK"], maxVehicleHeight: null,
    availability: { startISO: new Date(NOW + hr(4)).toISOString(), endISO: new Date(NOW + hr(12)).toISOString() },
    rules: ["Available in 4 hours."]
  },
  {
    id: "unsw-021", title: "Houston Rd Corner", subtitle: "Kingsford quiet area · 6 min walk",
    address: "5 Houston Rd, Kingsford NSW",
    lat: -33.9220, lng: 151.2255,
    ratePerHourXrp: 2.2, depositMultiple: 3, overstayMultiple: 2, access: "Kerbside bay",
    ownerWallet: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh", rating: 4.3, totalBookings: 41,
    features: ["Corner spot", "Easy reverse"], maxVehicleHeight: null,
    availability: { startISO: new Date(NOW + hr(2.5)).toISOString(), endISO: new Date(NOW + hr(8)).toISOString() },
    rules: ["Available in 2.5 hours."]
  },
  {
    id: "unsw-022", title: "Meeks St Deep Bay", subtitle: "Deep south campus · 8 min walk",
    address: "9 Meeks St, Kingsford NSW",
    lat: -33.9240, lng: 151.2245,
    ratePerHourXrp: 1.8, depositMultiple: 2, overstayMultiple: 2, access: "Driveway bay",
    ownerWallet: "rEfrEpYtS3SXqR2eFEZc3fLsrMoJU5Kqx", rating: 4.1, totalBookings: 17,
    features: ["Very deep driveway", "Suit long vehicles"], maxVehicleHeight: null,
    availability: { startISO: new Date(NOW + hr(5)).toISOString(), endISO: new Date(NOW + hr(15)).toISOString() },
    rules: ["Available in 5 hours."]
  },
  {
    id: "unsw-023", title: "Doncaster Reserve", subtitle: "Near park · 7 min walk",
    address: "75 Doncaster Ave, Kensington NSW",
    lat: -33.9170, lng: 151.2210,
    ratePerHourXrp: 1.5, depositMultiple: 2, overstayMultiple: 2, access: "Open driveway",
    ownerWallet: "rLDYrujdKUfVx28MyFaad6tK9rB9KnEZkq", rating: 4.5, totalBookings: 88,
    features: ["Park views", "Wide street"], maxVehicleHeight: null,
    availability: { startISO: new Date(NOW + hr(3.5)).toISOString(), endISO: new Date(NOW + hr(9)).toISOString() },
    rules: ["Available in 3.5 hours."]
  },
  {
    id: "unsw-024", title: "Bowral St Value", subtitle: "Further walk, better price · 9 min walk",
    address: "60 Bowral St, Kensington NSW",
    lat: -33.9125, lng: 151.2270,
    ratePerHourXrp: 1.2, depositMultiple: 2, overstayMultiple: 2, access: "Kerbside bay",
    ownerWallet: "rMWuhsGpyTgJzLhKhPt2VvnYFAFcLAMEkP", rating: 4.0, totalBookings: 14,
    features: ["Cheapest rate", "Good for 8h+"], maxVehicleHeight: null,
    availability: { startISO: new Date(NOW + hr(4.5)).toISOString(), endISO: new Date(NOW + hr(12)).toISOString() },
    rules: ["Available in 4.5 hours."]
  }
];